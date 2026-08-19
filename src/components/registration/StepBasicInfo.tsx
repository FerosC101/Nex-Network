import { useFormContext } from 'react-hook-form';
import type { RegistrationFormInput } from '@/schemas/registrationSchema';
import { TextField } from '@/components/ui/TextField';

export function StepBasicInfo() {
  const {
    register,
    formState: { errors },
  } = useFormContext<RegistrationFormInput>();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-2xl font-semibold text-ink">The basics.</h3>
        <p className="mt-1.5 text-sm text-ink-3">Tell us a little about yourself.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          label="First name"
          required
          autoComplete="given-name"
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <TextField
          label="Last name"
          required
          autoComplete="family-name"
          error={errors.lastName?.message}
          {...register('lastName')}
        />
      </div>

      <TextField
        label="Preferred name"
        hint="What should we call you? (optional)"
        autoComplete="nickname"
        error={errors.preferredName?.message}
        {...register('preferredName')}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          label="Email address"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Mobile number"
          type="tel"
          required
          autoComplete="tel"
          inputMode="tel"
          placeholder="09XX XXX XXXX"
          error={errors.mobileNumber?.message}
          {...register('mobileNumber')}
        />
      </div>

      <TextField
        label="Age"
        type="number"
        required
        inputMode="numeric"
        className="max-w-35"
        error={errors.age?.message}
        {...register('age')}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          label="Province"
          required
          placeholder="e.g. Batangas"
          error={errors.province?.message}
          {...register('province')}
        />
        <TextField
          label="City / Municipality"
          required
          placeholder="e.g. Lipa City"
          error={errors.city?.message}
          {...register('city')}
        />
      </div>
    </div>
  );
}
