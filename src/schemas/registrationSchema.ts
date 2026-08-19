import { z } from 'zod';
import { YEAR_LEVELS, INTERESTS, COMMUNITY_GOALS, BUILDING_STATUSES, COLLABORATION_NEEDS } from '@/types/registration';

// A pragmatic phone check: digits, spaces, +, -, () — 7 to 15 digits total.
// Accepts PH mobile formats (09xxxxxxxxx, +639xxxxxxxxx) and general use.
const PHONE_REGEX = /^[+]?[\d\s()-]{7,20}$/;

export const basicInfoSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.').max(80),
  lastName: z.string().trim().min(1, 'Last name is required.').max(80),
  preferredName: z.string().trim().max(80).optional().default(''),
  email: z.email('Enter a valid email address.').trim().toLowerCase(),
  mobileNumber: z
    .string()
    .trim()
    .min(1, 'Mobile number is required.')
    .regex(PHONE_REGEX, 'Enter a valid mobile number.')
    .refine((v) => v.replace(/\D/g, '').length >= 10, 'Mobile number looks too short.'),
  age: z.coerce
    .number({ error: 'Age is required.' })
    .int('Age must be a whole number.')
    .min(13, 'You must be at least 13.')
    .max(99, 'Enter a valid age.'),
  province: z.string().trim().min(1, 'Province is required.').max(120),
  city: z.string().trim().min(1, 'City / Municipality is required.').max(120),
});
export type BasicInfoForm = z.infer<typeof basicInfoSchema>;

export const studentInfoSchema = z.object({
  school: z.string().trim().min(1, 'School / University is required.').max(160),
  courseProgram: z.string().trim().min(1, 'Course / Program is required.').max(160),
  yearLevel: z.enum(YEAR_LEVELS, { error: 'Select your year level.' }),
});
export type StudentInfoForm = z.infer<typeof studentInfoSchema>;

export const interestsSchema = z.object({
  interests: z.array(z.enum(INTERESTS)).min(1, 'Pick at least one interest.'),
  otherInterest: z.string().trim().max(200).optional().default(''),
});
export type InterestsForm = z.infer<typeof interestsSchema>;

export const goalsSchema = z.object({
  goals: z.array(z.enum(COMMUNITY_GOALS)).min(1, "Pick at least one — what are you hoping to find?"),
  otherGoal: z.string().trim().max(200).optional().default(''),
  additionalNotes: z.string().trim().max(1000).optional().default(''),
});
export type GoalsForm = z.infer<typeof goalsSchema>;

export const builderProfileSchema = z
  .object({
    buildingStatus: z.enum(BUILDING_STATUSES).nullable().default(null),
    projectName: z.string().trim().max(160).optional().default(''),
    projectDescription: z.string().trim().max(1000).optional().default(''),
    collaborationNeeds: z.array(z.enum(COLLABORATION_NEEDS)).optional().default([]),
    otherCollaborationNeed: z.string().trim().max(200).optional().default(''),
  })
  .superRefine((data, ctx) => {
    const needsProjectDetails = data.buildingStatus === 'Yes' || data.buildingStatus === 'I have an idea';
    if (needsProjectDetails && !data.projectName.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['projectName'],
        message: 'Give your project or idea a name.',
      });
    }
  });
export type BuilderProfileForm = z.infer<typeof builderProfileSchema>;

export const consentSchema = z.object({
  agreedToTerms: z.literal(true, {
    error: 'You need to agree before joining Nex.',
  }),
});
export type ConsentForm = z.infer<typeof consentSchema>;

/** Full schema — union of every step, used for the final pre-submit check. */
export const registrationSchema = basicInfoSchema
  .extend(studentInfoSchema.shape)
  .extend(interestsSchema.shape)
  .extend(goalsSchema.shape)
  .extend(builderProfileSchema.shape)
  .extend(consentSchema.shape);
/** Output shape — after zod has applied coercion/defaults (e.g. age becomes a number). */
export type RegistrationForm = z.output<typeof registrationSchema>;
/** Input shape — what the form fields actually hold before validation runs. */
export type RegistrationFormInput = z.input<typeof registrationSchema>;

export const STEP_SCHEMAS = [
  basicInfoSchema,
  studentInfoSchema,
  interestsSchema,
  goalsSchema,
  builderProfileSchema,
  consentSchema,
] as const;
