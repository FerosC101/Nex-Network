import { useController, useFormContext } from 'react-hook-form';
import type { RegistrationFormInput } from '@/schemas/registrationSchema';
import { CheckboxPillGroup } from '@/components/ui/CheckboxPillGroup';
import { TextField } from '@/components/ui/TextField';
import { INTERESTS } from '@/types/registration';

export function StepInterests() {
  const { control, register, formState: { errors } } = useFormContext<RegistrationFormInput>();
  const { field } = useController({ name: 'interests', control });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-2xl font-semibold text-ink">What are you into?</h3>
        <p className="mt-1.5 text-sm text-ink-3">Pick as many as you like — this helps us match you with the right people.</p>
      </div>

      <CheckboxPillGroup
        legend="Interests"
        required
        options={INTERESTS}
        value={field.value}
        onChange={field.onChange}
        error={errors.interests?.message}
      />

      {field.value.includes('Other') && (
        <TextField
          label="Tell us more"
          required
          maxLength={100}
          placeholder="What else are you into?"
          error={errors.otherInterest?.message}
          {...register('otherInterest')}
        />
      )}
    </div>
  );
}
