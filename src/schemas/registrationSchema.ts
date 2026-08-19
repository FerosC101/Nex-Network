import { z } from 'zod';
import { YEAR_LEVELS, INTERESTS, COMMUNITY_GOALS, BUILDING_STATUSES, COLLABORATION_NEEDS } from '@/types/registration';

// A pragmatic phone check: digits, spaces, +, -, () — 7 to 15 digits total.
// Accepts PH mobile formats (09xxxxxxxxx, +639xxxxxxxxx) and general use.
const PHONE_REGEX = /^[+]?[\d\s()-]{7,20}$/;

/**
 * Consumer mail domains people mistype. zod's email check already rejects
 * anything malformed, but `gmial.com` and `gmail.co` are perfectly well-formed
 * — they just bounce, and a bounced invite means a student silently never
 * hears back. So near-misses are caught here and the correction suggested.
 *
 * Only consumer providers are listed. School domains are too varied to guess
 * at, and a wrong suggestion is worse than none.
 */
const COMMON_MAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'yahoo.com.ph', 'outlook.com', 'hotmail.com',
  'icloud.com', 'live.com', 'aol.com', 'proton.me', 'protonmail.com',
];

function editDistance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return rows[a.length][b.length];
}

/** The domain this looks like a typo of, or null when it seems fine. */
export function suggestEmailDomain(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain || COMMON_MAIL_DOMAINS.includes(domain)) return null;
  for (const known of COMMON_MAIL_DOMAINS) {
    if (editDistance(domain, known) <= 2) return known;
  }
  return null;
}

export const basicInfoSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.').max(80),
  lastName: z.string().trim().min(1, 'Last name is required.').max(80),
  preferredName: z.string().trim().max(80).optional().default(''),
  email: z
    .email('Enter a valid email address.')
    .trim()
    .toLowerCase()
    .superRefine((value, ctx) => {
      const suggestion = suggestEmailDomain(value);
      if (suggestion) {
        ctx.addIssue({
          code: 'custom',
          message: `Did you mean @${suggestion}? Check the spelling.`,
        });
      }
    }),
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

/**
 * Cross-field rules, kept in one place because they must be applied to the
 * COMBINED schema, not the per-step ones.
 *
 * The combined schema is built by spreading each step's `.shape`, and a shape
 * carries only the fields — any `.superRefine` on the step schema is silently
 * dropped. Since the form's resolver validates against the combined schema,
 * rules defined only on a step schema never run at all.
 */
type CrossFieldData = {
  buildingStatus?: string | null;
  projectName?: string;
  interests?: readonly string[];
  otherInterest?: string;
  goals?: readonly string[];
  otherGoal?: string;
  collaborationNeeds?: readonly string[];
  otherCollaborationNeed?: string;
};

function builderRules(data: CrossFieldData, ctx: z.RefinementCtx) {
  const needsProjectDetails =
    data.buildingStatus === 'Yes' || data.buildingStatus === 'I have an idea';
  if (needsProjectDetails && !data.projectName?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['projectName'], message: 'Give your project or idea a name.' });
  }
  // Picking "Other" and leaving the box empty tells us nothing — ask for it.
  if (data.collaborationNeeds?.includes('Other collaborators') && !data.otherCollaborationNeed?.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['otherCollaborationNeed'],
      message: 'You picked Other — tell us who you\'re looking for.',
    });
  }
}

function crossFieldRules(data: CrossFieldData, ctx: z.RefinementCtx) {
  builderRules(data, ctx);
  if (data.interests?.includes('Other') && !data.otherInterest?.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['otherInterest'],
      message: 'You picked Other — tell us what you\'re into.',
    });
  }
  if (data.goals?.includes('Other') && !data.otherGoal?.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['otherGoal'],
      message: 'You picked Other — tell us what you\'re hoping to find.',
    });
  }
}

const builderProfileObject = z
  .object({
    buildingStatus: z.enum(BUILDING_STATUSES).nullable().default(null),
    projectName: z.string().trim().max(160).optional().default(''),
    projectDescription: z.string().trim().max(1000).optional().default(''),
    collaborationNeeds: z.array(z.enum(COLLABORATION_NEEDS)).optional().default([]),
    otherCollaborationNeed: z.string().trim().max(200).optional().default(''),
  });

export const builderProfileSchema = builderProfileObject.superRefine(builderRules);
export type BuilderProfileForm = z.infer<typeof builderProfileSchema>;

export const consentSchema = z.object({
  agreedToTerms: z.literal(true, {
    error: 'You need to agree before joining Nex.',
  }),
});
export type ConsentForm = z.infer<typeof consentSchema>;

/** Full schema — union of every step, used for the final pre-submit check. */
const registrationObject = basicInfoSchema
  .extend(studentInfoSchema.shape)
  .extend(interestsSchema.shape)
  .extend(goalsSchema.shape)
  .extend(builderProfileObject.shape)
  .extend(consentSchema.shape);

// The rules live here, on the combined schema the resolver actually uses.
export const registrationSchema = registrationObject.superRefine(crossFieldRules);
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
