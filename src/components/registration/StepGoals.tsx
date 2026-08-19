import { useController, useFormContext } from 'react-hook-form';
import type { RegistrationFormInput } from '@/schemas/registrationSchema';
import { CheckboxPillGroup } from '@/components/ui/CheckboxPillGroup';
import { TextField } from '@/components/ui/TextField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { COMMUNITY_GOALS } from '@/types/registration';

export function StepGoals() {
  const { control, register, formState: { errors } } = useFormContext<RegistrationFormInput>();
  const { field } = useController({ name: 'goals', control });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-2xl font-semibold text-ink">What are you hoping to find in Nex?</h3>
        <p className="mt-1.5 text-sm text-ink-3">Select everything that applies.</p>
      </div>

      <CheckboxPillGroup
        legend="Community goals"
        required
        options={COMMUNITY_GOALS}
        value={field.value}
        onChange={field.onChange}
        error={errors.goals?.message}
      />

      {field.value.includes('Other') && (
        <TextField
          label="Tell us more"
          error={errors.otherGoal?.message}
          {...register('otherGoal')}
        />
      )}

      <TextAreaField
        label="Anything else you want us to know?"
        hint="Optional"
        error={errors.additionalNotes?.message}
        {...register('additionalNotes')}
      />
    </div>
  );
}
