import { Mail } from 'lucide-react';
import { Model3D } from '@/components/Model3D';
import { env } from '@/config/env';

// Only destinations that exist. Privacy, Terms and social profiles join this
// list once there is a page or an account to point at — a dead footer link
// is worse than none.
const COLUMNS = [
  {
    title: 'Nex',
    links: [
      { label: 'Community', href: '#community' },
      { label: 'Build', href: '#enables' },
      { label: 'Opportunities (soon)', href: '#opportunities' },
      { label: 'Events', href: '#events' },
      { label: 'People', href: '#people' },
    ],
  },
  {
    title: 'Members',
    links: [
      { label: 'Join Nex', href: '#register' },
      { label: 'Find my invite', href: '#find-invite' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-panel/60 px-6 pt-16 pb-10">
      <div aria-hidden="true" className="grid-veil pointer-events-none absolute inset-0 opacity-50 mask-[linear-gradient(to_bottom,black,transparent)]" />

      <div className="relative mx-auto w-full max-w-page">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-5">
              <div className="h-20 w-16 shrink-0">
                <Model3D
                  url="/nex-wordmark.glb"
                  fallbackSrc="/nex-wordmark-3d.png"
                  fallbackAlt="Nex Network"
                  distance={4.2}
                  sway={0.3}
                />
              </div>
              <div>
                <p className="font-display text-lg font-bold text-ink">
                  Nex <span className="font-semibold text-ink-3">Network</span>
                </p>
                <p className="mt-1 text-sm text-ink-3">Built by students, for students.</p>
              </div>
            </div>
            <p className="label-condensed mt-8 text-xs text-ink-3">
              Learn. Build. Collaborate. Compete. <span className="text-brand">Connect.</span>
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className="md:col-span-2">
              <p className="label-condensed text-[0.7rem] text-ink-4">{column.title}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-sm text-ink-2 transition-colors hover:text-brand">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="md:col-span-3">
            <p className="label-condensed text-[0.7rem] text-ink-4">Contact</p>
            <a
              href={`mailto:${env.contactEmail}`}
              className="mt-4 inline-flex items-start gap-2 text-sm [overflow-wrap:anywhere] text-ink-2 transition-colors hover:text-brand"
            >
              <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {env.contactEmail}
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-line pt-6 text-xs text-ink-4 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Nex Network · Batangas, Philippines</p>
          <p>An independent, student-led technology community.</p>
        </div>
      </div>
    </footer>
  );
}
