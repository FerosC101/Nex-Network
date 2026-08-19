import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { LogoModelUrl } from '@/components/three/NexLogoScene';

const NexLogoScene = lazy(() => import('@/components/three/NexLogoScene'));

/**
 * Renders a live 3D brand model, with a pre-rendered still standing in
 * whenever the real thing can't or shouldn't run: while three.js loads, on
 * devices without WebGL, if the scene throws, or while the element is
 * scrolled out of view.
 *
 * The still is never just a spinner substitute; it is the same artwork, so a
 * viewer who never gets the 3D path still sees the brand.
 *
 * **Only the on-screen model is mounted.** WebGL contexts are a scarce
 * resource, and running the hero and the footer scene at once was enough to
 * trigger `webglcontextlost`. They are never co-visible, so mounting on enter
 * and unmounting on exit keeps one scene alive at a time — and stops an
 * offscreen render loop from burning battery.
 */

interface Model3DProps {
  url: LogoModelUrl;
  /** Pre-rendered still shown as placeholder and fallback. */
  fallbackSrc: string;
  fallbackAlt: string;
  distance?: number;
  sway?: number;
}

class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

let webGLSupport: boolean | null = null;

/**
 * Probe for WebGL once per page, then release the probe's context.
 *
 * Both parts matter: a context is a scarce resource, and a probe that holds
 * one — times every component that asks — is enough on its own to push a page
 * over the limit and start losing the contexts that are actually drawing.
 */
function hasWebGL(): boolean {
  if (webGLSupport !== null) return webGLSupport;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    webGLSupport = Boolean(window.WebGLRenderingContext && gl);
    (gl as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webGLSupport = false;
  }

  return webGLSupport;
}

export function Model3D({
  url,
  fallbackSrc,
  fallbackAlt,
  distance,
  sway,
}: Model3DProps) {
  const host = useRef<HTMLDivElement>(null);
  const [canRender3D, setCanRender3D] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inView, setInView] = useState(false);
  // A lost context means this device can't sustain the scene; stay on the still.
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    setCanRender3D(hasWebGL());

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        setInView(visible);
        // Leaving view tears the scene down anyway, so clear any earlier loss
        // and let the next mount try again rather than degrading for good.
        if (!visible) setContextLost(false);
      },
      { rootMargin: '150px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const onLost = (event: Event) => {
      event.preventDefault();
      setContextLost(true);
    };
    el.addEventListener('webglcontextlost', onLost, true);
    return () => el.removeEventListener('webglcontextlost', onLost, true);
  }, []);

  const still = (
    <img src={fallbackSrc} alt={fallbackAlt} className="h-full w-full object-contain" />
  );

  const show3D = canRender3D && inView && !contextLost;

  return (
    <div ref={host} className="h-full w-full">
      {show3D ? (
        <SceneBoundary fallback={still}>
          <Suspense fallback={still}>
            <NexLogoScene url={url} reducedMotion={reducedMotion} distance={distance} sway={sway} />
          </Suspense>
        </SceneBoundary>
      ) : (
        still
      )}
    </div>
  );
}
