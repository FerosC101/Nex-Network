interface ProgressBarProps {
  step: number;
  totalSteps: number;
  labels: readonly string[];
}

export function ProgressBar({ step, totalSteps, labels }: ProgressBarProps) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-1.5" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={totalSteps} aria-label="Registration progress">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
              i <= step ? 'bg-brand' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <p className="mt-3 label-condensed text-xs text-ink-3">
        Step {step + 1} of {totalSteps} · {labels[step]}
      </p>
    </div>
  );
}
