import { useEffect, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { RegistrationFormInput } from '@/schemas/registrationSchema';
import { TextField } from '@/components/ui/TextField';
import { ComboboxField } from '@/components/ui/ComboboxField';
import { PH_LOCATIONS } from '@/data/phLocations';

export function StepBasicInfo() {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<RegistrationFormInput>();

  const selectedProvince = useWatch({ control, name: 'province' });
  const selectedCity = useWatch({ control, name: 'city' });
  const firstName = useWatch({ control, name: 'firstName' });
  const lastName = useWatch({ control, name: 'lastName' });
  const preferredName = useWatch({ control, name: 'preferredName' });
  const email = useWatch({ control, name: 'email' });
  const mobileNumber = useWatch({ control, name: 'mobileNumber' });
  const age = useWatch({ control, name: 'age' });

  // List of all province names
  const provinceOptions = useMemo(() => PH_LOCATIONS.map((loc) => loc.province), []);

  // Check if current province value is a valid committed province from our dataset
  const validProvinceMatch = useMemo(() => {
    if (!selectedProvince) return null;
    return (
      PH_LOCATIONS.find(
        (loc) => loc.province.toLowerCase() === selectedProvince.trim().toLowerCase(),
      ) ?? null
    );
  }, [selectedProvince]);

  const isValidProvince = Boolean(validProvinceMatch);

  // List of city options for the currently selected valid province
  const cityOptions = useMemo(() => {
    return validProvinceMatch ? validProvinceMatch.cities : [];
  }, [validProvinceMatch]);

  // When province changes or becomes invalid, reset city
  useEffect(() => {
    if (isValidProvince && cityOptions.length > 0) {
      if (selectedCity && !cityOptions.some((c) => c.toLowerCase() === selectedCity.toLowerCase())) {
        setValue('city', '', { shouldValidate: true });
      }
    } else {
      setValue('city', '', { shouldValidate: true });
    }
  }, [isValidProvince, cityOptions, selectedCity, setValue]);

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
          lettersOnly
          showCount
          maxLength={50}
          value={typeof firstName === 'string' ? firstName : ''}
          autoComplete="given-name"
          placeholder="e.g. Juan"
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <TextField
          label="Last name"
          required
          lettersOnly
          showCount
          maxLength={50}
          value={typeof lastName === 'string' ? lastName : ''}
          autoComplete="family-name"
          placeholder="e.g. dela Cruz"
          error={errors.lastName?.message}
          {...register('lastName')}
        />
      </div>

      <TextField
        label="Preferred name"
        hint="What should we call you? (optional)"
        lettersOnly
        showCount
        maxLength={50}
        value={typeof preferredName === 'string' ? preferredName : ''}
        autoComplete="nickname"
        placeholder="e.g. Jay"
        error={errors.preferredName?.message}
        {...register('preferredName')}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          label="Email address"
          type="email"
          required
          showCount
          maxLength={100}
          value={typeof email === 'string' ? email : ''}
          autoComplete="email"
          inputMode="email"
          placeholder="you@domain.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Mobile number"
          type="tel"
          required
          phoneOnly
          showCount
          maxLength={11}
          value={typeof mobileNumber === 'string' ? mobileNumber : ''}
          autoComplete="tel"
          inputMode="tel"
          placeholder="09XXXXXXXXX"
          error={errors.mobileNumber?.message}
          {...register('mobileNumber')}
        />
      </div>

      <TextField
        label="Age"
        type="number"
        required
        numericOnly
        showCount
        maxLength={2}
        min={13}
        max={99}
        value={typeof age === 'number' || typeof age === 'string' ? age : ''}
        inputMode="numeric"
        className="max-w-35"
        placeholder="e.g. 20"
        error={errors.age?.message}
        {...register('age')}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <ComboboxField
          label="Province"
          required
          strictSelection
          allowCustom={false}
          placeholder="Select valid province from dropdown…"
          options={provinceOptions}
          value={selectedProvince ?? ''}
          onChange={(val) => setValue('province', val, { shouldValidate: true })}
          error={errors.province?.message}
        />
        <ComboboxField
          label="City / Municipality"
          required
          strictSelection
          allowCustom={false}
          disabled={!isValidProvince}
          placeholder={isValidProvince ? 'Select city from dropdown…' : 'Pick valid province first'}
          options={cityOptions}
          value={selectedCity ?? ''}
          onChange={(val) => setValue('city', val, { shouldValidate: true })}
          error={errors.city?.message}
        />
      </div>
    </div>
  );
}
