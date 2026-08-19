const NODES = [
  { x: 60, y: 80 },
  { x: 220, y: 40 },
  { x: 340, y: 130 },
  { x: 180, y: 190 },
  { x: 420, y: 60 },
  { x: 500, y: 170 },
  { x: 100, y: 230 },
  { x: 380, y: 240 },
  { x: 300, y: 20 },
];

const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [1, 3],
  [2, 4],
  [2, 5],
  [3, 6],
  [2, 7],
  [4, 8],
  [5, 7],
];

/**
 * Subtle network graph — nodes and links gently pulse in and out.
 * Suggests people, ideas and opportunities linking up. Decorative only.
 */
export function ConnectionField({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 560 280" className={`h-auto w-full ${className}`} fill="none">
      <g stroke="var(--color-brand)" strokeWidth="1">
        {EDGES.map(([a, b], i) => {
          const from = NODES[a];
          const to = NODES[b];
          return (
            <line
              key={`${a}-${b}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              opacity={0.3}
              style={{ animation: 'breathe 6s ease-in-out infinite', animationDelay: `${i * 0.4}s` }}
            />
          );
        })}
      </g>
      <g>
        {NODES.map((node, i) => (
          <circle
            key={i}
            cx={node.x}
            cy={node.y}
            r={i % 3 === 0 ? 4 : 2.5}
            fill={i % 3 === 0 ? 'var(--color-brand)' : 'var(--color-brand-soft)'}
            style={{ animation: 'breathe 6s ease-in-out infinite', animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </g>
    </svg>
  );
}
