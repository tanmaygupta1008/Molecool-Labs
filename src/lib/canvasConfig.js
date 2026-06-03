/**
 * canvasConfig.js
 * ────────────────────────────────────────────────────────────────
 * Shared, GPU-safe WebGL settings for every <Canvas> in the project.
 *
 * Why each flag:
 *   powerPreference  → tells the GPU driver to assign the high-perf
 *                       (discrete) GPU instead of integrated.
 *   antialias        → smoother edges; cheap on modern GPUs.
 *   alpha: false     → skips compositing an alpha channel — saves one
 *                       full render buffer (≈ 8 MB per 1080p canvas).
 *   stencil: false   → stencil buffer is almost never used in R3F apps;
 *                       disabling it frees ~4 MB VRAM per context.
 *   depth: true      → depth buffer is always needed for 3D.
 *   preserveDrawingBuffer: false → allows the driver to discard frames
 *                       it no longer needs, reducing memory pressure.
 *   failIfMajorPerformanceCaveat: false → don't hard-fail on low-end
 *                       GPUs; let SafeCanvas show a graceful overlay.
 */
export const SAFE_GL = {
  powerPreference: 'high-performance',
  antialias: true,
  alpha: false,
  stencil: false,
  depth: true,
  preserveDrawingBuffer: false,
  failIfMajorPerformanceCaveat: false,
};

/**
 * Cap device pixel ratio between 1 and 1.5.
 * A DPR of 2 quadruples the pixel count and is the #1 cause of VRAM
 * exhaustion on Retina / HiDPI screens when multiple canvases exist.
 */
export const SAFE_DPR = [1, 1.5];
