import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  registrationSchema,
  STEP_SCHEMAS,
  type RegistrationForm,
  type RegistrationFormInput,
} from '@/schemas/registrationSchema';
import { submitRegistration } from '@/services/registrationService';
import type { RegistrationResult } from '@/types/registration';

export const STEPS = ['Basic info', 'Student info', 'Interests', 'Goals', 'Building?', 'Consent'] as const;
const DRAFT_STORAGE_KEY = 'nex_registration_draft_v1';
/**
 * Drafts expire, and hold no contact details.
 *
 * Students often register from a school lab or an internet cafe. Persisting a
 * name, email, phone and age in localStorage meant the next person on that
 * machine saw them prefilled — one student's contact details handed to a
 * stranger. The draft now keeps only the slow-to-retype parts (interests,
 * goals, project notes) and forgets them after a day.
 */
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
const PERSONAL_FIELDS = [
  'firstName', 'lastName', 'preferredName', 'email', 'mobileNumber', 'age',
] as const;

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
  savedAt: number;
  values: Partial<RegistrationFormInput>;
}

/** Strip anything that identifies or contacts the person. */
function withoutPersonalFields(values: RegistrationFormInput): Partial<RegistrationFormInput> {
  const copy: Partial<RegistrationFormInput> = { ...values };
  for (const field of PERSONAL_FIELDS) delete copy[field];
  return copy;
}

/** Below this, a submission is scripted rather than typed. */
const MIN_HUMAN_SECONDS = 8;

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
  // Passive spam checks — see BotTrap.
  const [honeypot, setHoneypot] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const startedAt = useRef(Date.now());

  // 1. Load draft from localStorage on initial render
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedRaw) {
        const parsed: StoredDraft = JSON.parse(savedRaw);
        const fresh =
          typeof parsed?.savedAt === 'number' && Date.now() - parsed.savedAt < DRAFT_TTL_MS;
        if (parsed && typeof parsed === 'object' && parsed.values && fresh) {
          // Merge over the defaults: the stored draft intentionally has no
          // personal fields, so a plain reset would leave them undefined.
          form.reset({ ...DEFAULT_VALUES, ...parsed.values });
          if (typeof parsed.step === 'number' && parsed.step >= 0 && parsed.step < STEPS.length) {
            setStep(parsed.step);
          }
          setIsDraftRestored(true);
        } else {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
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
          savedAt: Date.now(),
          values: withoutPersonalFields(watchValues),
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

    // The resolver validates the COMBINED schema, and zod only runs an
    // object's .superRefine() after the base object parses. Mid-flow the later
    // steps are still empty, so that parse always fails and every conditional
    // rule — "Other" needing detail, a project needing a name — was silently
    // skipped. Re-checking against this step's own schema, where the data IS
    // complete, is what actually enforces them.
    const stepSchema = STEP_SCHEMAS[step];
    const parsed = stepSchema.safeParse(form.getValues());
    if (!parsed.success) {
      let focused = false;
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.') as Path<RegistrationFormInput>;
        if (!fields.includes(path)) continue;
        form.setError(path, { type: 'manual', message: issue.message });
        if (!focused) {
          form.setFocus(path);
          focused = true;
        }
      }
      if (focused) return;
    }

    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [form, step]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const submit = form.handleSubmit(async (values) => {
    // Silently accept and drop: telling a bot why it failed just helps it
    // adapt, and a real person can never reach this branch.
    const tooFast = (Date.now() - startedAt.current) / 1000 < MIN_HUMAN_SECONDS;
    if (honeypot.trim() || tooFast) {
      setResult({ success: true });
      setSubmittedEmail(values.email);
      return;
    }

    if (submissionInFlight.current) return;
    submissionInFlight.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const outcome = await submitRegistration(values, captchaToken);
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
    honeypot,
    setHoneypot,
    captchaToken,
    setCaptchaToken,
  };
}
