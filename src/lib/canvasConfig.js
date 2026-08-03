/**
 * canvasConfig.js
 * ────────────────────────────────────────────────────────────────
 * Shared, GPU-safe WebGL settings for every <Canvas> in the project.
 *
 * Why each flag:
 *   powerPreference  → tells the GPU driver to assign the high-perf
 *                       (discrete) GPU instead of integrated.
 *   antialias        → DISABLED by default to save a full MSAA render
 *                       buffer (≈8–16 MB per context on low-end GPUs).
 *                       Individual canvases can re-enable it via the
 *                       `gl` prop override if the scene warrants it.
 *   alpha: false     → skips compositing an alpha channel — saves one
 *                       full render buffer (≈8 MB per 1080p canvas).
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
  antialias: false,           // OFF by default — saves MSAA buffer (~8–16 MB / context)
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

/**
 * Strictly limited DPR for inline / modal viewers where GPU budget is
 * already shared with other canvases on the same page.
 */
export const SAFE_DPR_STRICT = [1, 1];

/**
 * Default frameloop mode.
 * "demand" = Three.js only draws when explicitly invalidated (via
 *   state.invalidate() / useThree()'s invalidate).  This eliminates
 *   idle GPU load on static scenes (molecule viewers, atom models).
 * Override to "always" for continuously animated scenes (fluid sim,
 *   DNA strand, VSEPR physics builder).
 */
export const FRAMELOOP_DEFAULT = 'demand';
