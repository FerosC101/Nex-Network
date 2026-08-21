import { useEffect, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { RegistrationFormInput } from '@/schemas/registrationSchema';
import { TextField } from '@/components/ui/TextField';
import { SelectField } from '@/components/ui/SelectField';
import { ComboboxField } from '@/components/ui/ComboboxField';
import { YEAR_LEVELS, SHS_STRANDS } from '@/types/registration';
import { PH_UNIVERSITIES } from '@/data/phUniversities';

const SENIOR_HIGH_YEARS = new Set(['Grade 11', 'Grade 12']);

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

  const isSeniorHigh = useMemo(() => {
    return Boolean(yearLevel && SENIOR_HIGH_YEARS.has(yearLevel));
  }, [yearLevel]);

  // Check if current school value is a non-empty typed string (from list or custom)
  const isValidSchool = useMemo(() => {
    if (!selectedSchool || typeof selectedSchool !== 'string') return false;
    return selectedSchool.trim().length > 0;
  }, [selectedSchool]);

  // When school becomes empty, reset course/program
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
        allowCustom={true}
        strictSelection={false}
        showCount
        maxLength={120}
        placeholder="Select or type university name…"
        emptyMessage="No matching university found."
        options={PH_UNIVERSITIES}
        value={typeof selectedSchool === 'string' ? selectedSchool : ''}
        onChange={(val) => setValue('school', val, { shouldValidate: true })}
        error={errors.school?.message}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Year Level - FIRST COLUMN */}
        <SelectField
          label="Year level"
          required
          options={YEAR_LEVELS}
          value={typeof yearLevel === 'string' ? yearLevel : ''}
          onChange={(e) => {
            const newYear = e.target.value;
            const wasSHS = SENIOR_HIGH_YEARS.has(yearLevel ?? '');
            const isNowSHS = SENIOR_HIGH_YEARS.has(newYear);

            // Reset course/strand if switching between SHS and College
            if (wasSHS !== isNowSHS) {
              setValue('courseProgram', '', { shouldValidate: false });
            }
            setValue('yearLevel', newYear as any, { shouldValidate: true });
          }}
          error={errors.yearLevel?.message}
        />

        {/* Course / Program or Strand / Track - SECOND COLUMN */}
        {isSeniorHigh ? (
          <ComboboxField
            label="Strand / Track"
            required
            allowCustom={true}
            strictSelection={false}
            disabled={!isValidSchool}
            showCount
            maxLength={100}
            placeholder={isValidSchool ? 'Select or type SHS strand…' : 'Select university first…'}
            emptyMessage="No matching strand found."
            options={SHS_STRANDS}
            value={typeof courseProgram === 'string' ? courseProgram : ''}
            onChange={(val) => setValue('courseProgram', val, { shouldValidate: true })}
            error={errors.courseProgram?.message}
          />
        ) : (
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
        )}
      </div>
    </div>
  );
}
