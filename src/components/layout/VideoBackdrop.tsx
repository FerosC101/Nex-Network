import { useEffect, useRef, useState } from 'react';

/**
 * The rebrand film as an ambient background layer.
 *
 * Decorative and silent by design: a background that makes noise or that the
 * viewer can't escape is a nuisance, so this is permanently muted and never
 * exposes controls. The poster frame is the baseline — the video only ever
 * layers on top of it.
 *
 * The poster is a deliberately abstract frame roughly 2s in, matched by the
 * video's `#t=2` start so the crossfade is seamless. The film's own closing
 * logo frame is a bad fit here: as a backdrop it sits directly behind the 3D
 * mark and reads as a duplicated, blurry logo.
 *
 * Because this sits above the fold, it deliberately does NOT load for everyone.
 * The 3.4 MB file is skipped entirely when the viewer has asked for reduced
 * motion, has Data Saver on, or is on a 2G-class connection; those visitors get
 * the 17 KB poster, which looks intentional rather than broken.
 */

/**
 * Phones get a 640px cut (~730 KB) instead of the 1280px master (~3.3 MB).
 * The backdrop is heavily blurred and dimmed, so the smaller source is
 * indistinguishable — and on mobile data the difference is the whole point.
 */
function videoSource(): string {
  return window.innerWidth < 768 ? '/nex-rebrand-mobile.mp4#t=2' : '/nex-rebrand.mp4#t=2';
}

function wantsMotion(): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;

  // Save-Data and effectiveType are Chromium-only; absence just means "no signal".
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;

  if (connection?.saveData) return false;
  if (connection?.effectiveType && /2g/.test(connection.effectiveType)) return false;

  return true;
}

export function VideoBackdrop() {
  const video = useRef<HTMLVideoElement>(null);
  const [play, setPlay] = useState(false);
  const [ready, setReady] = useState(false);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setPlay(wantsMotion());
    setSrc(videoSource());
  }, []);

  useEffect(() => {
    const el = video.current;
    if (!el || !play) return;

    // Deferred a beat so the video never competes with the hero's own first
    // paint — the poster is already carrying the visual.
    const id = window.setTimeout(() => {
      el.load();
      el.play().catch(() => undefined);
    }, 400);

    return () => window.clearTimeout(id);
  }, [play]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
      <img
        src="/nex-rebrand-poster.jpg"
        alt=""
        className="absolute inset-0 h-full w-full scale-105 object-cover blur-[3px]"
      />

      {play && src && (
        <video
          ref={video}
          className={`absolute inset-0 h-full w-full scale-105 object-cover blur-[3px] transition-opacity duration-1000 ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
          src={src}
          preload="none"
          muted
          loop
          playsInline
          disablePictureInPicture
          onPlaying={() => setReady(true)}
        />
      )}

      {/* Legibility stack for the centred hero: an even dim, then a
          vignette that darkens the edges and fades to solid at top and bottom
          so the nav stays readable and the section joins the next cleanly. */}
      <div className="absolute inset-0 bg-void/65" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,transparent,var(--color-void))]" />
      <div className="absolute inset-0 bg-gradient-to-b from-void/80 via-transparent to-void" />
    </div>
  );
}
