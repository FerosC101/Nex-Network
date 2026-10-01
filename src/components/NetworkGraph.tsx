import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE_OUT_SOFT } from '@/components/motion/easing';

type Kind = 'you' | 'skill' | 'project' | 'people' | 'opportunity' | 'event';

interface GraphNode {
  id: string;
  label: string;
  /** Used on phones, where the long label would run off the edge. */
  short?: string;
  kind: Kind;
  /** Position as a percentage of the graph box. */
  x: number;
  y: number;
  info: string;
}

// Concepts, not people: every node is something Nex actually connects, and
// the two events are real (see Activities). Nothing here claims a member,
// project, or opportunity that doesn't exist.
const NODES: GraphNode[] = [
  { id: 'you', label: 'You', kind: 'you', x: 50, y: 50, info: 'A student in Batangas with an idea, a skill, or just curiosity. Everything in Nex starts here.' },
  { id: 'python', label: 'Python', kind: 'skill', x: 24, y: 26, info: 'A skill you bring — or pick up from members who already use it every day.' },
  { id: 'uiux', label: 'UI/UX', kind: 'skill', x: 76, y: 24, info: 'Designers are half of every good project. Nex puts them in the same room as builders.' },
  { id: 'ai', label: 'AI & ML', kind: 'skill', x: 20, y: 72, info: 'Artificial intelligence and machine learning — learn it together, then build with it.' },
  { id: 'web', label: 'Web dev', kind: 'skill', x: 80, y: 70, info: 'Ship something people can actually open — the fastest way from idea to feedback.' },
  { id: 'project', label: 'Your project', kind: 'project', x: 62, y: 40, info: 'Where skills meet. Nex helps you find the people your idea is missing.' },
  { id: 'team', label: 'Teammates', kind: 'people', x: 92, y: 44, info: 'Collaborators, contributors, and testers with skills that complement yours.' },
  { id: 'mentors', label: 'Mentors', kind: 'people', x: 90, y: 90, info: 'Students and builders a step ahead, who have done the thing you are about to try.' },
  { id: 'hackathon', label: 'Hackathons', kind: 'opportunity', x: 60, y: 8, info: 'Build under pressure with a team — and bring the project home afterwards.' },
  { id: 'internships', label: 'Internships', kind: 'opportunity', x: 40, y: 92, info: 'Opportunities surfaced by members who went for them first.' },
  { id: 'codegolf', label: 'Code Golf', kind: 'event', x: 8, y: 46, info: 'Sep 28, 2026 at Bluemoon Cafe — members raced to write the shortest Python solutions.' },
  { id: 'aws', label: 'AWS Community Day', short: 'AWS Day', kind: 'event', x: 12, y: 94, info: 'Sep 11, 2026 in Manila — members networked and learned cloud computing on AWS.' },
];

const EDGES: [string, string][] = [
  ['you', 'python'], ['you', 'uiux'], ['you', 'ai'], ['you', 'web'], ['you', 'project'],
  ['python', 'codegolf'], ['python', 'project'], ['uiux', 'project'], ['web', 'project'],
  ['project', 'team'], ['project', 'hackathon'], ['team', 'mentors'], ['web', 'mentors'],
  ['ai', 'aws'], ['ai', 'internships'], ['hackathon', 'uiux'],
];

const KIND_LABEL: Record<Kind, string> = {
  you: 'Student',
  skill: 'Skill',
  project: 'Project',
  people: 'People',
  opportunity: 'Opportunity',
  event: 'Nex event',
};

const byId = new Map(NODES.map((n) => [n.id, n]));

function neighbours(id: string) {
  return new Set(EDGES.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : [])));
}

/**
 * "Nex connects people and opportunities", shown as something to explore.
 * Choosing a node lights its links and dims the rest, and the card explains
 * the connection. Nodes are real buttons, so keyboard and touch work exactly
 * like hover — and the card sits beside the graph, not in a tooltip that a
 * finger would cover.
 */
export function NetworkGraph() {
  const [activeId, setActiveId] = useState('you');
  const active = byId.get(activeId)!;
  const linked = neighbours(activeId);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
      <div className="relative aspect-[4/5] w-full sm:aspect-[16/10]">
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          {EDGES.map(([a, b]) => {
            const from = byId.get(a)!;
            const to = byId.get(b)!;
            const lit = a === activeId || b === activeId;
            return (
              <line
                key={`${a}-${b}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                vectorEffect="non-scaling-stroke"
                stroke={lit ? 'var(--color-brand)' : 'var(--color-slate)'}
                strokeWidth={lit ? 1.5 : 1}
                strokeDasharray={lit ? '4 4' : undefined}
                className={`transition-[stroke,opacity] duration-300 ${lit ? 'animate-[dash-flow_1.2s_linear_infinite] motion-reduce:animate-none' : ''}`}
                opacity={lit ? 1 : 0.7}
              />
            );
          })}
        </svg>

        {NODES.map((node) => {
          const isActive = node.id === activeId;
          const isLinked = linked.has(node.id);
          const dim = !isActive && !isLinked;
          return (
            <button
              key={node.id}
              type="button"
              aria-pressed={isActive}
              aria-label={`${node.label} — ${KIND_LABEL[node.kind]}`}
              onMouseEnter={() => setActiveId(node.id)}
              onFocus={() => setActiveId(node.id)}
              onClick={() => setActiveId(node.id)}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2.5 py-1 text-[0.7rem] font-medium whitespace-nowrap backdrop-blur-sm transition-all duration-300 sm:px-3 sm:py-1.5 sm:text-xs ${
                isActive
                  ? 'z-10 scale-110 border-brand bg-brand text-on-brand shadow-glow'
                  : isLinked
                    ? 'border-brand/50 bg-surface text-ink'
                    : 'border-slate bg-void/80 text-ink-3'
              } ${dim ? 'opacity-45' : 'opacity-100'} ${node.kind === 'you' && !isActive ? 'border-brand/60 text-brand' : ''}`}
            >
              {node.kind === 'event' && <span aria-hidden="true" className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-brand align-middle" />}
              {node.short ? (
                <>
                  <span className="sm:hidden">{node.short}</span>
                  <span className="hidden sm:inline">{node.label}</span>
                </>
              ) : (
                node.label
              )}
            </button>
          );
        })}
      </div>

      <div className="relative min-h-44 rounded-card border border-line bg-surface/70 p-5 shadow-card" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: EASE_OUT_SOFT }}
          >
            <p className="label-condensed text-[0.65rem] text-brand">{KIND_LABEL[active.kind]}</p>
            <p className="mt-2 font-display text-lg font-bold text-ink">{active.label}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-3">{active.info}</p>
            <p className="mt-4 text-xs text-ink-4">
              Connects to{' '}
              {[...linked].map((id, i, all) => (
                <span key={id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(id)}
                    className="text-ink-2 underline decoration-slate underline-offset-4 transition-colors hover:text-brand hover:decoration-brand"
                  >
                    {byId.get(id)!.label}
                  </button>
                  {i < all.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
