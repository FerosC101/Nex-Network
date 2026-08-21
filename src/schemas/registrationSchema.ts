import { z } from 'zod';
import { YEAR_LEVELS, INTERESTS, COMMUNITY_GOALS, BUILDING_STATUSES, COLLABORATION_NEEDS } from '@/types/registration';

// A pragmatic phone check: digits, spaces, +, -, () — 7 to 20 digits total.
// Accepts PH mobile formats (09xxxxxxxxx, +639xxxxxxxxx) and general use.
const PHONE_REGEX = /^[+]?[\d\s()-]{7,20}$/;

/**
 * What may appear in a person's name.
 *
 * \p{L} is any Unicode letter, not just A-Z. That matters here: an ASCII-only
 * rule rejects Ñ and every accented vowel, which quietly turns away Niño,
 * Peña, Muñoz and José — ordinary Filipino names. \p{M} covers accents typed
 * as separate combining marks, and the punctuation allows O'Brien, Mary-Jane
 * and the "Ma." short for Maria.
 */
const NAME_REGEX = /^[\p{L}\p{M}\s'.-]+$/u;

/** Helper to detect excessive consecutive repeated characters (e.g. "aaaaa") */
export function hasConsecutiveSpam(val: string, maxConsecutive = 4): boolean {
  if (!val) return false;
  const regex = new RegExp(`(.)\\1{${maxConsecutive - 1},}`, 'i');
  return regex.test(val);
}

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
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required.')
    .max(50, 'First name must be 50 characters or less.')
    .refine((v) => NAME_REGEX.test(v), 'First name can only contain letters.')
    .refine((v) => !hasConsecutiveSpam(v, 4), 'First name contains too many repeated characters.'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required.')
    .max(50, 'Last name must be 50 characters or less.')
    .refine((v) => NAME_REGEX.test(v), 'Last name can only contain letters.')
    .refine((v) => !hasConsecutiveSpam(v, 4), 'Last name contains too many repeated characters.'),
  preferredName: z
    .string()
    .trim()
    .max(50, 'Preferred name must be 50 characters or less.')
    .refine((v) => !v || NAME_REGEX.test(v), 'Preferred name can only contain letters.')
    .refine((v) => !v || !hasConsecutiveSpam(v, 4), 'Preferred name contains too many repeated characters.')
    .optional()
    .default(''),
  email: z
    .email('Enter a valid email address.')
    .trim()
    .toLowerCase()
    .max(100, 'Email must be 100 characters or less.')
    .refine((v) => !hasConsecutiveSpam(v.split('@')[0] || '', 4), 'Email prefix contains too many repeated characters.')
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
    .max(20, 'Mobile number is too long.')
    .regex(PHONE_REGEX, 'Enter a valid mobile number.')
    .refine((v) => v.replace(/\D/g, '').length >= 10, 'Mobile number looks too short.')
    .refine((v) => !hasConsecutiveSpam(v.replace(/\D/g, ''), 7), 'Mobile number contains invalid repeated digits.'),
  age: z.coerce
    .number({ error: 'Age is required.' })
    .int('Age must be a whole number.')
    .min(13, 'You must be at least 13.')
    .max(99, 'Enter a valid age (13-99).'),
  province: z
    .string()
    .trim()
    .min(1, 'Province is required.')
    .max(100, 'Province name is too long.')
    .refine((v) => !hasConsecutiveSpam(v, 4), 'Province contains invalid repeated characters.'),
  city: z
    .string()
    .trim()
    .min(1, 'City / Municipality is required.')
    .max(100, 'City / Municipality name is too long.')
    .refine((v) => !hasConsecutiveSpam(v, 4), 'City contains invalid repeated characters.'),
});
export type BasicInfoForm = z.infer<typeof basicInfoSchema>;

/** Senior high students take a strand; a BS/AB title means they picked the wrong year level. */
const SENIOR_HIGH = new Set<string>(['Grade 11', 'Grade 12']);
const DEGREE_TITLE = /^\s*(bs|ba|ab|bsc|bachelor)\b/i;

const studentInfoObject = z.object({
  school: z
    .string()
    .trim()
    .min(1, 'School / University is required.')
    .max(120, 'School name must be 120 characters or less.')
    .refine((v) => !hasConsecutiveSpam(v, 4), 'School name contains too many repeated characters.'),
  courseProgram: z
    .string()
    .trim()
    .min(1, 'Course / Program is required.')
    .max(100, 'Course / Program must be 100 characters or less.')
    .refine((v) => !/^\d+$/.test(v), 'Course / Program cannot be numbers only.')
    .refine((v) => !hasConsecutiveSpam(v, 4), 'Course / Program contains too many repeated characters.'),
  yearLevel: z.enum(YEAR_LEVELS, { error: 'Select your year level.' }),
});
export const studentInfoSchema = studentInfoObject.superRefine((data, ctx) => {
  if (SENIOR_HIGH.has(data.yearLevel) && DEGREE_TITLE.test(data.courseProgram ?? '')) {
    ctx.addIssue({
      code: 'custom',
      path: ['courseProgram'],
      message:
        'Grade 11–12 take a strand (STEM, ABM, HUMSS, GAS, TVL). Choose a college year level if you\'re taking a degree.',
    });
  }
});
export type StudentInfoForm = z.infer<typeof studentInfoSchema>;

const interestsObject = z.object({
  interests: z.array(z.enum(INTERESTS)).min(1, 'Pick at least one interest.'),
  otherInterest: z
    .string()
    .trim()
    .max(100, 'Must be 100 characters or less.')
    .refine((v) => !v || !hasConsecutiveSpam(v, 4), 'Contains too many repeated characters.')
    .optional()
    .default(''),
});
export const interestsSchema = interestsObject.superRefine((data, ctx) => {
  if (data.interests?.includes('Other') && !data.otherInterest?.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['otherInterest'],
      message: "You picked Other — tell us what you're into.",
    });
  }
});
export type InterestsForm = z.infer<typeof interestsSchema>;

const goalsObject = z.object({
  goals: z.array(z.enum(COMMUNITY_GOALS)).min(1, "Pick at least one — what are you hoping to find?"),
  otherGoal: z
    .string()
    .trim()
    .max(100, 'Must be 100 characters or less.')
    .refine((v) => !v || !hasConsecutiveSpam(v, 4), 'Contains too many repeated characters.')
    .optional()
    .default(''),
  additionalNotes: z
    .string()
    .trim()
    .max(500, 'Notes must be 500 characters or less.')
    .refine((v) => !v || !hasConsecutiveSpam(v, 5), 'Notes contain too many repeated characters.')
    .optional()
    .default(''),
});
export const goalsSchema = goalsObject.superRefine((data, ctx) => {
  if (data.goals?.includes('Other') && !data.otherGoal?.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['otherGoal'],
      message: "You picked Other — tell us what you're hoping to find.",
    });
  }
});
export type GoalsForm = z.infer<typeof goalsSchema>;

/**
 * Cross-field rules, kept in one place because they must be applied to the
 * COMBINED schema, not the per-step ones.
 */
type CrossFieldData = {
  yearLevel?: string;
  courseProgram?: string;
  buildingStatus?: string | null;
  projectName?: string;
  projectDescription?: string;
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
  if (
    SENIOR_HIGH.has(String(data.yearLevel ?? '')) &&
    DEGREE_TITLE.test(String(data.courseProgram ?? ''))
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['courseProgram'],
      message:
        'Grade 11–12 take a strand (STEM, ABM, HUMSS, GAS, TVL). Choose a college year level if you\'re taking a degree.',
    });
  }
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

const builderProfileObject = z.object({
  buildingStatus: z.enum(BUILDING_STATUSES).nullable().default(null),
  projectName: z
    .string()
    .trim()
    .max(100, 'Project name must be 100 characters or less.')
    .refine((v) => !v || !hasConsecutiveSpam(v, 5), 'Project name contains too many repeated characters.')
    .optional()
    .default(''),
  projectDescription: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or less.')
    .refine((v) => !v || !hasConsecutiveSpam(v, 5), 'Description contains too many repeated characters.')
    .optional()
    .default(''),
  collaborationNeeds: z.array(z.enum(COLLABORATION_NEEDS)).optional().default([]),
  otherCollaborationNeed: z
    .string()
    .trim()
    .max(100, 'Must be 100 characters or less.')
    .refine((v) => !v || !hasConsecutiveSpam(v, 4), 'Contains too many repeated characters.')
    .optional()
    .default(''),
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
  .extend(studentInfoObject.shape)
  .extend(interestsObject.shape)
  .extend(goalsObject.shape)
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
