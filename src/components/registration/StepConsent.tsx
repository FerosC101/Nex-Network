import { useFormContext } from 'react-hook-form';
import { Mail } from 'lucide-react';
import type { RegistrationFormInput } from '@/schemas/registrationSchema';

export function StepConsent() {
  const {
    register,
    formState: { errors },
  } = useFormContext<RegistrationFormInput>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-2xl font-semibold text-ink">Almost there.</h3>
        <p className="mt-1.5 text-sm text-ink-3">One last thing before you're in.</p>
      </div>

      <div className="flex gap-3 rounded-2xl border border-brand/25 bg-brand/8 p-4">
        <Mail className="mt-0.5 h-4.5 w-4.5 shrink-0 text-brand" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-ink-2">
          We review every registration to make sure Nex stays a community of students from Batangas. Once
          you're verified, we'll email you the invite to our community group chat.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm leading-relaxed text-ink-2">
          By joining Nex, you agree to be part of the Nex Network student community and allow Nex to use
          the information provided to contact you regarding community activities, opportunities, events,
          and announcements.
        </p>

        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-line bg-void text-brand accent-[var(--color-brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-invalid={Boolean(errors.agreedToTerms)}
            aria-describedby={errors.agreedToTerms ? 'consent-error' : undefined}
            {...register('agreedToTerms')}
          />
          <span className="text-sm text-ink">
            I agree to the Nex Network community terms and privacy notice.
          </span>
        </label>
        {errors.agreedToTerms && (
          <p id="consent-error" role="alert" className="mt-2 text-xs font-medium text-red-300">
            {errors.agreedToTerms.message}
          </p>
        )}
      </div>
    </div>
  );
}
