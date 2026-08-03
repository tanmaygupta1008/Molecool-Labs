/**
 * geometryLOD.js
 * ──────────────────────────────────────────────────────────────
 * Adaptive Level-of-Detail helper for Three.js geometry creation.
 *
 * On low-end hardware (≤4 GB RAM, ≤4 logical CPUs, or a small
 * max renderbuffer), segment counts are automatically halved so
 * scene complexity stays within the WebGL rendering budget.
 *
 * Usage:
 *   import { sphereSegs, cylSegs, torusSegs } from '@/utils/geometryLOD';
 *
 *   // Instead of hardcoding 32:
 *   <sphereGeometry args={[r, sphereSegs(16), sphereSegs(16)]} />
 *   <cylinderGeometry args={[r, r, h, cylSegs(8)]} />
 */

// ─── Hardware tier detection (runs once at module load) ──────────────────────

function detectTier() {
  // Only runs in browser
  if (typeof window === 'undefined') return 'high';

  const cpuCores   = navigator.hardwareConcurrency ?? 8;
  const ramGB      = navigator.deviceMemory        ?? 8; // undefined on Firefox → assume high
  const isLowCPU  = cpuCores <= 4;
  const isLowRAM  = ramGB    <= 4;

  // Optional: probe WebGL for max renderbuffer size as a GPU proxy
  let isLowGPU = false;
  try {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (gl) {
      const maxRb = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
      isLowGPU = maxRb < 4096;
      // Clean up immediately — we don't want this test canvas consuming a context slot
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
  } catch (_) {
    // Ignore — context probing is best-effort
  }

  if (isLowRAM || isLowCPU || isLowGPU) return 'low';
  return 'high';
}

/** 'low' | 'high' — computed once when the module loads */
export const PERF_TIER = detectTier();

/** True when running on a low-end device */
export const IS_LOW_END = PERF_TIER === 'low';

// ─── Segment helpers ─────────────────────────────────────────────────────────

/**
 * Returns an adjusted sphere segment count.
 * @param {number} base - Segment count for high-end hardware (e.g. 16, 32)
 * @returns {number}
 */
export function sphereSegs(base = 16) {
  return IS_LOW_END ? Math.max(8, Math.floor(base * 0.6)) : base;
}

/**
 * Returns an adjusted cylinder/tube radial segment count.
 * @param {number} base - Segment count for high-end hardware (e.g. 8, 12)
 * @returns {number}
 */
export function cylSegs(base = 8) {
  return IS_LOW_END ? Math.max(6, Math.floor(base * 0.6)) : base;
}

/**
 * Returns an adjusted torus radial segment count.
 * @param {number} base - Segment count for high-end hardware (e.g. 16, 100)
 * @returns {number}
 */
export function torusSegs(base = 16) {
  return IS_LOW_END ? Math.max(8, Math.floor(base * 0.6)) : base;
}

/**
 * Safe Device Pixel Ratio range.
 * Low-end hardware gets capped to 1.0 to prevent pixel-fill overload.
 */
export const SAFE_DPR_LOD = IS_LOW_END ? [1, 1] : [1, 1.5];
