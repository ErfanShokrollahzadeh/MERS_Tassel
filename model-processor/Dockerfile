FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app
RUN addgroup --system processor && adduser --system --ingroup processor processor
COPY model-processor/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY model-processor/app ./app
RUN mkdir -p /model-data && chown -R processor:processor /app /model-data
USER processor
EXPOSE 8090
HEALTHCHECK --interval=20s --timeout=4s --start-period=20s --retries=4 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8090/health', timeout=3)"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8090", "--workers", "1"]
