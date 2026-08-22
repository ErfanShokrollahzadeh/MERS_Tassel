import AppKit
import AVFoundation
import CoreGraphics

enum VideoError: Error {
    case missingArguments
    case imageUnreadable
    case imageConversionFailed
    case writerSetupFailed
    case pixelBufferFailed
    case appendFailed
}

let arguments = CommandLine.arguments.filter { $0 != "--" }
guard arguments.count >= 3 else {
    fputs("Usage: swift generate_testimonial_video.swift input-image output-video\n", stderr)
    throw VideoError.missingArguments
}

let inputURL = URL(fileURLWithPath: arguments[arguments.count - 2])
let outputURL = URL(fileURLWithPath: arguments[arguments.count - 1])
let width = 1280
let height = 720
let fps: Int32 = 30
let duration = 10
let frameCount = Int(fps) * duration

guard let sourceImage = NSImage(contentsOf: inputURL) else {
    throw VideoError.imageUnreadable
}

var sourceRect = CGRect(origin: .zero, size: sourceImage.size)
guard let cgImage = sourceImage.cgImage(forProposedRect: &sourceRect, context: nil, hints: nil) else {
    throw VideoError.imageConversionFailed
}

try? FileManager.default.removeItem(at: outputURL)
let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)
let videoSettings: [String: Any] = [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: 1_400_000,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        AVVideoExpectedSourceFrameRateKey: fps,
        AVVideoMaxKeyFrameIntervalKey: fps * 2,
    ],
]

let input = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(
    assetWriterInput: input,
    sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
        kCVPixelBufferWidthKey as String: width,
        kCVPixelBufferHeightKey as String: height,
    ]
)

guard writer.canAdd(input) else { throw VideoError.writerSetupFailed }
writer.add(input)
guard writer.startWriting() else { throw writer.error ?? VideoError.writerSetupFailed }
writer.startSession(atSourceTime: .zero)

let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!
let sourceWidth = CGFloat(cgImage.width)
let sourceHeight = CGFloat(cgImage.height)
let canvasWidth = CGFloat(width)
let canvasHeight = CGFloat(height)
let baseScale = max(canvasWidth / sourceWidth, canvasHeight / sourceHeight)

for frame in 0..<frameCount {
    while !input.isReadyForMoreMediaData {
        Thread.sleep(forTimeInterval: 0.001)
    }

    guard let pool = adaptor.pixelBufferPool else { throw VideoError.pixelBufferFailed }
    var optionalBuffer: CVPixelBuffer?
    guard CVPixelBufferPoolCreatePixelBuffer(nil, pool, &optionalBuffer) == kCVReturnSuccess,
          let pixelBuffer = optionalBuffer else {
        throw VideoError.pixelBufferFailed
    }

    CVPixelBufferLockBaseAddress(pixelBuffer, [])
    defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, []) }

    guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer),
          let context = CGContext(
            data: baseAddress,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: CVPixelBufferGetBytesPerRow(pixelBuffer),
            space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
          ) else {
        throw VideoError.pixelBufferFailed
    }

    let phase = (Double(frame) / Double(frameCount - 1)) * Double.pi * 2
    let breathingZoom = 1.045 + (1 - cos(phase)) * 0.0225
    let scale = baseScale * CGFloat(breathingZoom)
    let drawnWidth = sourceWidth * scale
    let drawnHeight = sourceHeight * scale
    let driftX = CGFloat(sin(phase)) * 11
    let driftY = CGFloat(sin(phase * 0.5)) * 4
    let drawRect = CGRect(
        x: (canvasWidth - drawnWidth) / 2 + driftX,
        y: (canvasHeight - drawnHeight) / 2 + driftY,
        width: drawnWidth,
        height: drawnHeight
    )

    context.setFillColor(NSColor.black.cgColor)
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    context.interpolationQuality = .high
    context.translateBy(x: 0, y: canvasHeight)
    context.scaleBy(x: 1, y: -1)
    let flippedRect = CGRect(x: drawRect.minX, y: canvasHeight - drawRect.maxY, width: drawRect.width, height: drawRect.height)
    context.draw(cgImage, in: flippedRect)

    let presentationTime = CMTime(value: Int64(frame), timescale: fps)
    guard adaptor.append(pixelBuffer, withPresentationTime: presentationTime) else {
        throw writer.error ?? VideoError.appendFailed
    }
}

input.markAsFinished()
let finished = DispatchSemaphore(value: 0)
writer.finishWriting { finished.signal() }
finished.wait()

guard writer.status == .completed else {
    throw writer.error ?? VideoError.appendFailed
}

print("Created \(outputURL.path)")
