import { useEffect, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { RegistrationFormInput } from '@/schemas/registrationSchema';
import { TextField } from '@/components/ui/TextField';
import { SelectField } from '@/components/ui/SelectField';
import { ComboboxField } from '@/components/ui/ComboboxField';
import { YEAR_LEVELS } from '@/types/registration';
import { PH_UNIVERSITIES } from '@/data/phUniversities';

export function StepStudentInfo() {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<RegistrationFormInput>();

  const selectedSchool = useWatch({ control, name: 'school' });
  const courseProgram = useWatch({ control, name: 'courseProgram' });
  const yearLevel = useWatch({ control, name: 'yearLevel' });

  // Check if current school value is a valid committed school / university
  const isValidSchool = useMemo(() => {
    if (!selectedSchool || typeof selectedSchool !== 'string') return false;
    return selectedSchool.trim().length > 0;
  }, [selectedSchool]);

  // When school becomes invalid or empty, reset course/program
  useEffect(() => {
    if (!isValidSchool && courseProgram) {
      setValue('courseProgram', '', { shouldValidate: true });
    }
  }, [isValidSchool, courseProgram, setValue]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-2xl font-semibold text-ink">Where are you studying?</h3>
        <p className="mt-1.5 text-sm text-ink-3">Helps us connect you with people nearby and in your field.</p>
      </div>

      <ComboboxField
        label="School / University"
        required
        strictSelection
        showCount
        maxLength={120}
        placeholder="Select or search university…"
        options={PH_UNIVERSITIES}
        value={typeof selectedSchool === 'string' ? selectedSchool : ''}
        onChange={(val) => setValue('school', val, { shouldValidate: true })}
        error={errors.school?.message}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          label="Course / Program"
          required
          disabled={!isValidSchool}
          showCount
          maxLength={100}
          value={typeof courseProgram === 'string' ? courseProgram : ''}
          placeholder={isValidSchool ? 'e.g. BS Computer Science' : 'Select university first…'}
          error={errors.courseProgram?.message}
          {...register('courseProgram')}
        />
        <SelectField
          label="Year level"
          required
          options={YEAR_LEVELS}
          value={typeof yearLevel === 'string' ? yearLevel : ''}
          onChange={(e) => setValue('yearLevel', e.target.value as any, { shouldValidate: true })}
          error={errors.yearLevel?.message}
        />
      </div>
    </div>
  );
}
