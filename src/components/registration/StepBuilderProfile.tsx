import { useController, useFormContext, useWatch } from 'react-hook-form';
import type { RegistrationFormInput } from '@/schemas/registrationSchema';
import { RadioCardGroup } from '@/components/ui/RadioCardGroup';
import { CheckboxPillGroup } from '@/components/ui/CheckboxPillGroup';
import { TextField } from '@/components/ui/TextField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { BUILDING_STATUSES, COLLABORATION_NEEDS } from '@/types/registration';

export function StepBuilderProfile() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<RegistrationFormInput>();
  const buildingStatus = useController({ name: 'buildingStatus', control });
  const collaborationNeeds = useController({ name: 'collaborationNeeds', control });
  const projectDescription = useController({ name: 'projectDescription', control });

  const projectName = useWatch({ control, name: 'projectName' });
  const otherCollaborationNeed = useWatch({ control, name: 'otherCollaborationNeed' });

  const showProjectFields =
    buildingStatus.field.value === 'Yes' || buildingStatus.field.value === 'I have an idea';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-2xl font-semibold text-ink">Are you already building something?</h3>
        <p className="mt-1.5 text-sm text-ink-3">
          Totally optional — but this is how Nex helps you find people to build with.
        </p>
      </div>

      <RadioCardGroup
        legend="Your building status"
        name="buildingStatus"
        options={BUILDING_STATUSES}
        value={buildingStatus.field.value ?? null}
        onChange={buildingStatus.field.onChange}
      />

      {showProjectFields && (
        <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface/60 p-5">
          <TextField
            label="Project / Idea name"
            required
            showCount
            maxLength={100}
            value={projectName ?? ''}
            placeholder="e.g. SpartanRide"
            error={errors.projectName?.message}
            {...register('projectName')}
          />
          <TextAreaField
            label="Short description"
            hint="What's it about? A sentence or two is fine."
            maxLength={500}
            showCount
            value={projectDescription.field.value ?? ''}
            error={errors.projectDescription?.message}
            {...register('projectDescription')}
          />
          <CheckboxPillGroup
            legend="What are you looking for?"
            options={COLLABORATION_NEEDS}
            value={collaborationNeeds.field.value ?? []}
            onChange={collaborationNeeds.field.onChange}
          />
          {(collaborationNeeds.field.value ?? []).includes('Other collaborators') && (
            <TextField
              label="Tell us more"
              required
              showCount
              maxLength={100}
              value={otherCollaborationNeed ?? ''}
              placeholder="e.g. UI Designers, Data Analysts"
              error={errors.otherCollaborationNeed?.message}
              {...register('otherCollaborationNeed')}
            />
          )}
        </div>
      )}
    </div>
  );
}
