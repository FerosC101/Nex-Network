/** Ambient brand-tinted glow. Purely decorative — sits behind content, never interactive. */
export function GlowBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="grid-veil absolute inset-0 mask-[radial-gradient(ellipse_75%_65%_at_50%_0%,black,transparent)]" />
      <div className="animate-drift absolute -top-40 left-[6%] h-80 w-80 rounded-full bg-brand/20 blur-[130px]" />
      <div className="animate-drift-slow absolute top-10 right-[2%] h-104 w-104 rounded-full bg-brand-deep/15 blur-[150px]" />
      <div className="animate-drift absolute bottom-[-15%] left-[35%] h-72 w-72 rounded-full bg-brand/10 blur-[140px]" />
    </div>
  );
}
