import { useCallback, useRef, useState } from 'react';
import { useForm, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registrationSchema, type RegistrationForm, type RegistrationFormInput } from '@/schemas/registrationSchema';
import { submitRegistration } from '@/services/registrationService';
import type { RegistrationResult } from '@/types/registration';

export const STEPS = ['Basic info', 'Student info', 'Interests', 'Goals', 'Building?', 'Consent'] as const;

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
  // Kept so the success screen can echo back where the invite email will go,
  // even though the form itself is no longer rendered at that point.
  const [submittedEmail, setSubmittedEmail] = useState('');
  // Guards against double-submit from a double click / repeated Enter press.
  const submissionInFlight = useRef(false);

  const goNext = useCallback(async () => {
    const fields = STEP_FIELDS[step];
    const valid = await form.trigger(fields, { shouldFocus: true });
    if (!valid) return;
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
  };
}
