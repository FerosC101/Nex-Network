/**
 * The Nex mark — the official brand asset (white + light-blue S on
 * transparency), served from /public. `withWordmark` sets it next to the
 * Nex name for headers and footers where the mark alone reads too small.
 */
interface LogoProps {
  className?: string;
  size?: number;
  withWordmark?: boolean;
}

export function Logo({ className = '', size = 34, withWordmark = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/nex-mark.png"
        alt=""
        width={size}
        height={size}
        className="shrink-0"
        style={{ width: size, height: size }}
      />
      {withWordmark && (
        <span className="text-lg font-semibold tracking-tight text-ink">
          Nex<span className="text-brand"> Network</span>
        </span>
      )}
    </div>
  );
}
