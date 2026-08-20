import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FormProvider } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Loader2, RotateCcw } from 'lucide-react';
import { Section } from '@/components/layout/Section';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/registration/ProgressBar';
import { StepBasicInfo } from '@/components/registration/StepBasicInfo';
import { StepStudentInfo } from '@/components/registration/StepStudentInfo';
import { StepInterests } from '@/components/registration/StepInterests';
import { StepGoals } from '@/components/registration/StepGoals';
import { StepBuilderProfile } from '@/components/registration/StepBuilderProfile';
import { StepConsent } from '@/components/registration/StepConsent';
import { SuccessScreen } from '@/components/registration/SuccessScreen';
import { BotTrap } from '@/components/registration/BotTrap';
import { useRegistrationForm } from '@/hooks/useRegistrationForm';

const STEP_COMPONENTS = [
  StepBasicInfo,
  StepStudentInfo,
  StepInterests,
  StepGoals,
  StepBuilderProfile,
];

export function RegistrationSection() {
  const {
    form,
    step,
    totalSteps,
    stepLabels,
    goNext,
    goBack,
    submit,
    isSubmitting,
    submitError,
    submittedEmail,
    isSuccess,
    isDraftRestored,
    clearDraft,
    honeypot,
    setHoneypot,
    setCaptchaToken,
  } = useRegistrationForm();

  const isLastStep = step === totalSteps - 1;
  const CurrentStep = STEP_COMPONENTS[step];

  const stepContainerRef = useRef<HTMLDivElement>(null);

  // Accessibility (a11y): Shift DOM focus to top of step card on step transition
  useEffect(() => {
    stepContainerRef.current?.focus();
  }, [step]);

  return (
    <Section id="register" className="bg-base/40">
      <div className="mx-auto max-w-2xl text-center">
        <p className="label-condensed text-brand text-sm">Registration</p>
        <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">Let's get to know you.</h2>
        <p className="mt-4 text-ink-2">Tell us a little about yourself. It only takes a minute.</p>
      </div>

      <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-line bg-base p-6 shadow-[0_24px_90px_-24px_rgba(92,214,215,0.18)] sm:p-9">
        {isSuccess ? (
          <SuccessScreen email={submittedEmail} />
        ) : (
          <FormProvider {...form}>
            <ProgressBar step={step} totalSteps={totalSteps} labels={stepLabels} />

            {isDraftRestored && (
              <div className="mb-6 flex items-center justify-between rounded-xl border border-brand/30 bg-brand/10 px-4 py-2.5 text-xs text-brand">
                <span>Draft restored from your last session.</span>
                <button
                  type="button"
                  onClick={clearDraft}
                  className="inline-flex items-center gap-1 font-medium hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  Start fresh
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (isLastStep) {
                  void submit();
                } else {
                  void goNext();
                }
              }}
              noValidate
            >
              <BotTrap value={honeypot} onChange={setHoneypot} />

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  ref={stepContainerRef}
                  tabIndex={-1}
                  aria-live="polite"
                  aria-label={`Step ${step + 1} of ${totalSteps}: ${stepLabels[step]}`}
                  className="outline-none"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {isLastStep ? (
                    <StepConsent onCaptchaToken={setCaptchaToken} />
                  ) : (
                    <CurrentStep />
                  )}
                </motion.div>
              </AnimatePresence>

              {submitError && (
                <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                  {submitError}
                </p>
              )}

              <div className="mt-9 flex items-center justify-between gap-3">
                {step > 0 ? (
                  <Button type="button" variant="ghost" onClick={goBack} disabled={isSubmitting}>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back
                  </Button>
                ) : (
                  <span />
                )}

                {isLastStep ? (
                  <Button type="submit" variant="primary" disabled={isSubmitting} className="px-7 uppercase">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Joining…
                      </>
                    ) : (
                      <>
                        Join Nex
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button type="submit" variant="primary" className="px-7">
                    Next
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </form>
          </FormProvider>
        )}
      </div>
    </Section>
  );
}
