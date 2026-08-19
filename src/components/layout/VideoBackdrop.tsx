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

  useEffect(() => {
    setPlay(wantsMotion());
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

      {play && (
        <video
          ref={video}
          className={`absolute inset-0 h-full w-full scale-105 object-cover blur-[3px] transition-opacity duration-1000 ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
          src="/nex-rebrand.mp4#t=2"
          preload="none"
          muted
          loop
          playsInline
          disablePictureInPicture
          onPlaying={() => setReady(true)}
        />
      )}

      {/* Legibility stack — shaped around the hero layout rather than a flat
          scrim, so the film still reads. Heaviest on the left where the
          headline and CTA sit, lighter across the right where it plays behind
          the 3D mark, and fading to solid at top and bottom so the nav stays
          readable and the section joins the next one cleanly. */}
      <div className="absolute inset-0 bg-void/55 lg:bg-void/45" />
      {/* The left-weighted pass is shaped for the desktop two-column layout;
          on mobile the copy is centred, so an even scrim serves it better. */}
      <div className="absolute inset-0 hidden bg-gradient-to-r from-void via-void/68 to-void/20 lg:block" />
      <div className="absolute inset-0 bg-gradient-to-b from-void/80 via-transparent to-void" />
    </div>
  );
}
