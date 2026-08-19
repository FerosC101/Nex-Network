import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registrationSchema, type RegistrationForm, type RegistrationFormInput } from '@/schemas/registrationSchema';
import { submitRegistration, checkEmailRegistered } from '@/services/registrationService';
import type { RegistrationResult } from '@/types/registration';

export const STEPS = ['Basic info', 'Student info', 'Interests', 'Goals', 'Building?', 'Consent'] as const;
const DRAFT_STORAGE_KEY = 'nex_registration_draft_v1';

const STEP_FIELDS: Path<RegistrationFormInput>[][] = [
  ['firstName', 'lastName', 'preferredName', 'email', 'mobileNumber', 'age', 'province', 'city'],
  ['school', 'courseProgram', 'yearLevel'],
  ['interests', 'otherInterest'],
  ['goals', 'otherGoal', 'additionalNotes'],
  ['buildingStatus', 'projectName', 'projectDescription', 'collaborationNeeds', 'otherCollaborationNeed'],
  ['agreedToTerms'],
];

const DEFAULT_VALUES: RegistrationFormInput = {
  firstName: '',
  lastName: '',
  preferredName: '',
  email: '',
  mobileNumber: '',
  age: '' as unknown as number,
  province: '',
  city: '',
  school: '',
  courseProgram: '',
  yearLevel: undefined as unknown as RegistrationFormInput['yearLevel'],
  interests: [],
  otherInterest: '',
  goals: [],
  otherGoal: '',
  additionalNotes: '',
  buildingStatus: null,
  projectName: '',
  projectDescription: '',
  collaborationNeeds: [],
  otherCollaborationNeed: '',
  agreedToTerms: false as unknown as true,
};

interface StoredDraft {
  step: number;
  values: RegistrationFormInput;
}

export function useRegistrationForm() {
  const form = useForm<RegistrationFormInput, unknown, RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onTouched',
  });

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const submissionInFlight = useRef(false);

  // 1. Load draft from localStorage on initial render
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedRaw) {
        const parsed: StoredDraft = JSON.parse(savedRaw);
        if (parsed && typeof parsed === 'object' && parsed.values) {
          form.reset(parsed.values);
          if (typeof parsed.step === 'number' && parsed.step >= 0 && parsed.step < STEPS.length) {
            setStep(parsed.step);
          }
          setIsDraftRestored(true);
        }
      }
    } catch {
      // Ignore corrupted localStorage data
    }
  }, [form]);

  // 2. Auto-save form values & current step to localStorage on form changes
  const watchValues = form.watch();
  useEffect(() => {
    if (result?.success) return; // Don't save draft if already completed

    const timer = setTimeout(() => {
      try {
        const draft: StoredDraft = {
          step,
          values: watchValues,
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch {
        // Ignore quota/storage errors
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [watchValues, step, result?.success]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore
    }
    form.reset(DEFAULT_VALUES);
    setStep(0);
    setIsDraftRestored(false);
  }, [form]);

  const goNext = useCallback(async () => {
    const fields = STEP_FIELDS[step];
    const valid = await form.trigger(fields, { shouldFocus: true });
    if (!valid) return;

    // Early Email Duplicate check on Step 1
    if (step === 0) {
      const emailValue = form.getValues('email');
      if (emailValue) {
        const isDuplicate = await checkEmailRegistered(emailValue);
        if (isDuplicate) {
          form.setError('email', {
            type: 'manual',
            message: "You've already registered with this email — we'll be in touch once reviewed.",
          });
          return;
        }
      }
    }

    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [form, step]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const submit = form.handleSubmit(async (values) => {
    if (submissionInFlight.current) return;
    submissionInFlight.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const outcome = await submitRegistration(values);
      setResult(outcome);
      if (outcome.success) {
        setSubmittedEmail(values.email);
        // Clear saved draft on success
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch {
          // Ignore
        }
      } else {
        setSubmitError(outcome.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
      submissionInFlight.current = false;
    }
  });

  return {
    form,
    step,
    totalSteps: STEPS.length,
    stepLabels: STEPS,
    goNext,
    goBack,
    submit,
    isSubmitting,
    submitError,
    result,
    submittedEmail,
    isSuccess: result?.success === true,
    isDraftRestored,
    clearDraft,
  };
}
