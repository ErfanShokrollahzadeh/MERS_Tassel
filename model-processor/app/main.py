import hmac
import os
from pathlib import Path

import numpy as np
import trimesh
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

ROOT = Path(os.getenv("MODEL_DATA_ROOT", "/model-data")).resolve()
PROCESSOR_KEY = os.getenv("MODEL_PROCESSOR_KEY", "")
app = FastAPI(title="MERS Tassel model processor", docs_url=None, redoc_url=None)


class ProcessRequest(BaseModel):
    inputPath: str
    outputPath: str
    widthMm: float = Field(gt=0, le=5000)
    heightMm: float = Field(gt=0, le=5000)
    depthMm: float = Field(gt=0, le=5000)
    placement: str


def safe_path(relative: str) -> Path:
    candidate = (ROOT / relative).resolve()
    if ROOT not in candidate.parents:
        raise HTTPException(400, "Invalid model-data path")
    return candidate


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/v1/process")
def process_model(payload: ProcessRequest, x_processor_key: str = Header(default="")):
    if PROCESSOR_KEY and not hmac.compare_digest(PROCESSOR_KEY, x_processor_key):
        raise HTTPException(403, "Invalid internal processor key")
    if payload.placement not in {"floor", "wall"}:
        raise HTTPException(400, "Placement must be floor or wall")

    source = safe_path(payload.inputPath)
    target = safe_path(payload.outputPath)
    if not source.is_file():
        raise HTTPException(404, "Input GLB is missing")

    try:
        scene = trimesh.load(source, file_type="glb", force="scene", process=True)
    except Exception as exc:
        raise HTTPException(422, f"GLB could not be parsed: {exc}") from exc
    if not isinstance(scene, trimesh.Scene) or not scene.geometry:
        raise HTTPException(422, "GLB contains no renderable geometry")

    bounds = np.asarray(scene.bounds, dtype=float)
    extents = bounds[1] - bounds[0]
    if not np.all(np.isfinite(extents)) or np.any(extents <= 1e-8):
        raise HTTPException(422, "GLB has invalid or flat bounds")

    target_m = np.array([payload.widthMm, payload.heightMm, payload.depthMm], dtype=float) / 1000.0
    ratios = target_m / extents
    scale = float(np.median(ratios))
    projected = extents * scale
    tolerance_m = np.maximum(target_m * 0.02, 0.002)
    mismatch = np.abs(projected - target_m)
    if np.any(mismatch > tolerance_m):
        raise HTTPException(422, "Generated proportions differ from measured dimensions beyond the 2%/2mm publication tolerance")

    scene.apply_transform(np.diag([scale, scale, scale, 1.0]))
    scaled_bounds = np.asarray(scene.bounds, dtype=float)
    center = (scaled_bounds[0] + scaled_bounds[1]) / 2.0
    translation = -center
    if payload.placement == "floor":
        translation[1] = -scaled_bounds[0][1]
    else:
        translation[2] = -scaled_bounds[0][2]
    transform = np.eye(4)
    transform[:3, 3] = translation
    scene.apply_transform(transform)

    triangles = sum(len(mesh.faces) for mesh in scene.geometry.values() if hasattr(mesh, "faces"))
    if triangles > 100_000:
        raise HTTPException(422, f"Generated model has {triangles} triangles; blocking maximum is 100000")

    target.parent.mkdir(parents=True, exist_ok=True)
    try:
        target.write_bytes(scene.export(file_type="glb"))
    except Exception as exc:
        raise HTTPException(422, f"Normalized GLB export failed: {exc}") from exc

    final_extents = np.asarray(scene.extents, dtype=float) * 1000.0
    return {
        "outputPath": payload.outputPath,
        "validation": {
            "passed": True,
            "scaleMode": "uniform",
            "placement": payload.placement,
            "triangleCount": int(triangles),
            "declaredDimensionsMm": [payload.widthMm, payload.heightMm, payload.depthMm],
            "detectedDimensionsMm": [round(float(value), 2) for value in final_extents],
            "dimensionTolerance": "2% or 2mm, whichever is greater",
            "originAligned": True,
        },
    }
