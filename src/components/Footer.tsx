import { Model3D } from '@/components/Model3D';
import { env } from '@/config/env';

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line px-6 py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 text-center">
        <div className="h-28 w-28">
          <Model3D
            url="/nex-wordmark.glb"
            fallbackSrc="/nex-wordmark-3d.png"
            fallbackAlt="Nex Network"
            distance={4.2}
            sway={0.3}
          />
        </div>

        <p className="label-condensed text-sm text-ink-2">
          Learn. Build. Collaborate. Compete. Connect.
        </p>
        <p className="text-lg font-semibold text-brand">Your next starts here.</p>

        <a
          href={`mailto:${env.contactEmail}`}
          className="mt-2 text-sm text-ink-3 underline-offset-4 transition-colors hover:text-brand hover:underline"
        >
          {env.contactEmail}
        </a>

        <p className="mt-3 text-xs text-ink-4">
          © {new Date().getFullYear()} Nex Network · Batangas, Philippines
        </p>
      </div>
    </footer>
  );
}
