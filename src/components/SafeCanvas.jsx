'use client';

/**
 * SafeCanvas.jsx
 * ────────────────────────────────────────────────────────────────
 * Drop-in replacement for <Canvas> from @react-three/fiber.
 *
 * What it does:
 *  1. Injects SAFE_GL + SAFE_DPR automatically so every 3D page gets
 *     GPU-safe defaults without repeating config everywhere.
 *  2. Defaults to frameloop="demand" — the canvas only redraws when
 *     explicitly invalidated (orbit, pointer events, state changes).
 *     Pass frameloop="always" for continuously animated scenes.
 *  3. Attaches webglcontextlost / webglcontextrestored listeners via
 *     onCreated — when the GPU yanks the context it unmounts the canvas
 *     (freeing all GPU resources) and shows a recovery overlay.
 *  4. Clicking "Try Again" (or the auto-restore event) remounts the
 *     Canvas fresh — Three.js rebuilds the GL context cleanly.
 *  5. Wraps everything in a CanvasErrorBoundary so React errors inside
 *     the scene don't crash the whole page.
 *  6. Exposes an `onInvalidate` ref callback so parent components can
 *     trigger a redraw imperatively (useful in demand mode).
 *
 * Usage — just swap <Canvas> for <SafeCanvas>:
 *   import SafeCanvas from '@/components/SafeCanvas';
 *   <SafeCanvas camera={{ position: [0, 5, 10] }}>
 *     ...scene...
 *   </SafeCanvas>
 *
 *   // For continuously animated scenes:
 *   <SafeCanvas frameloop="always">...</SafeCanvas>
 *
 *   // To trigger a redraw from outside:
 *   const invalidateRef = useRef(null);
 *   <SafeCanvas onInvalidate={fn => { invalidateRef.current = fn; }}>
 *   // then call: invalidateRef.current?.()
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { SAFE_GL, SAFE_DPR, FRAMELOOP_DEFAULT } from '@/lib/canvasConfig';

// ─── Invalidate bridge (demand mode) ─────────────────────────────────────────
// A tiny R3F hook component that exposes state.invalidate to the parent.
// Must live inside <Canvas> so useThree() works.
function InvalidateBridge({ onInvalidate }) {
  const { invalidate } = useThree();
  useEffect(() => {
    if (onInvalidate) onInvalidate(invalidate);
  }, [invalidate, onInvalidate]);
  return null;
}

// ─── Error Boundary ──────────────────────────────────────────────────────────
class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[SafeCanvas] Scene render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.overlay}>
          <div style={styles.card}>
            <span style={styles.icon}>⚠️</span>
            <h2 style={styles.title}>3D Scene Error</h2>
            <p style={styles.msg}>{this.state.error?.message || 'An unknown error occurred in the 3D scene.'}</p>
            <button
              style={styles.btn}
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Context-Loss Overlay ─────────────────────────────────────────────────────
function ContextLostOverlay({ onRetry }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <span style={styles.icon}>🖥️</span>
        <h2 style={styles.title}>WebGL Context Lost</h2>
        <p style={styles.msg}>
          The GPU context was reset — this usually happens when the browser
          tab is in the background for a long time or GPU memory runs low.
        </p>
        <button style={styles.btn} onClick={onRetry}>
          🔄 Restore Scene
        </button>
      </div>
    </div>
  );
}

// ─── SafeCanvas ───────────────────────────────────────────────────────────────
export default function SafeCanvas({
  children,
  onCreated,
  gl,
  dpr,
  frameloop,
  onInvalidate,
  ...props
}) {
  const [contextLost, setContextLost] = useState(false);
  // mountKey forces a full remount of <Canvas> on recovery
  const mountKey = useRef(0);
  // savedInvalidate holds the scene's invalidate fn so we can call it on restore
  const savedInvalidate = useRef(null);

  const handleCreated = useCallback(
    (state) => {
      const canvas = state.gl.domElement;

      canvas.addEventListener('webglcontextlost', (e) => {
        // Prevent the browser default (which would permanently lose the context)
        e.preventDefault();
        console.warn('[SafeCanvas] WebGL context lost — unmounting canvas.');
        setContextLost(true);
      });

      canvas.addEventListener('webglcontextrestored', () => {
        console.info('[SafeCanvas] WebGL context restored — remounting canvas.');
        mountKey.current += 1;
        setContextLost(false);
        // Request one redraw immediately after restore so the scene is visible
        setTimeout(() => savedInvalidate.current?.(), 50);
      });

      // Forward to any onCreated the page already had
      onCreated?.(state);
    },
    [onCreated]
  );

  const handleRetry = useCallback(() => {
    mountKey.current += 1;
    setContextLost(false);
    setTimeout(() => savedInvalidate.current?.(), 50);
  }, []);

  const handleInvalidate = useCallback(
    (fn) => {
      savedInvalidate.current = fn;
      onInvalidate?.(fn);
    },
    [onInvalidate]
  );

  // Merge caller's gl overrides on top of our safe defaults
  const mergedGl = { ...SAFE_GL, ...gl };
  // Caller can still override DPR; default to SAFE_DPR
  const mergedDpr = dpr ?? SAFE_DPR;
  // Caller can still override frameloop; default to demand
  const mergedFrameloop = frameloop ?? FRAMELOOP_DEFAULT;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <CanvasErrorBoundary>
        {!contextLost && (
          <Canvas
            key={mountKey.current}
            dpr={mergedDpr}
            gl={mergedGl}
            frameloop={mergedFrameloop}
            onCreated={handleCreated}
            {...props}
          >
            {/* Bridge exposes invalidate to parent and saves it for context-restore */}
            <InvalidateBridge onInvalidate={handleInvalidate} />
            {children}
          </Canvas>
        )}
      </CanvasErrorBoundary>

      {contextLost && <ContextLostOverlay onRetry={handleRetry} />}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    zIndex: 100,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    background: 'rgba(20, 20, 30, 0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '40px 48px',
    maxWidth: '440px',
    textAlign: 'center',
    boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
  },
  icon: {
    fontSize: '48px',
    lineHeight: 1,
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#f1f5f9',
    fontFamily: 'system-ui, sans-serif',
  },
  msg: {
    margin: 0,
    fontSize: '14px',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 1.6,
    fontFamily: 'system-ui, sans-serif',
  },
  btn: {
    marginTop: '8px',
    padding: '10px 28px',
    background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'system-ui, sans-serif',
    transition: 'opacity 0.2s',
  },
};
