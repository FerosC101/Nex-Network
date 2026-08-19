import { useFormContext } from 'react-hook-form';
import type { RegistrationFormInput } from '@/schemas/registrationSchema';
import { TextField } from '@/components/ui/TextField';
import { SelectField } from '@/components/ui/SelectField';
import { YEAR_LEVELS } from '@/types/registration';

export function StepStudentInfo() {
  const {
    register,
    formState: { errors },
  } = useFormContext<RegistrationFormInput>();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-2xl font-semibold text-ink">Where are you studying?</h3>
        <p className="mt-1.5 text-sm text-ink-3">Helps us connect you with people nearby and in your field.</p>
      </div>

      <TextField
        label="School / University"
        required
        autoComplete="organization"
        error={errors.school?.message}
        {...register('school')}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          label="Course / Program"
          required
          placeholder="e.g. BS Computer Science"
          error={errors.courseProgram?.message}
          {...register('courseProgram')}
        />
        <SelectField
          label="Year level"
          required
          options={YEAR_LEVELS}
          error={errors.yearLevel?.message}
          {...register('yearLevel')}
        />
      </div>
    </div>
  );
}
