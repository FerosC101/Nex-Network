import { getSupabaseClient } from '@/lib/supabaseClient';
import { env } from '@/config/env';
import type { MembersInsert } from '@/types/database';
import type { RegistrationPayload, RegistrationResult } from '@/types/registration';

const UNIQUE_VIOLATION = '23505';

function toRow(payload: RegistrationPayload): MembersInsert {
  return {
    first_name: payload.firstName,
    last_name: payload.lastName,
    preferred_name: payload.preferredName || null,
    email: payload.email,
    mobile_number: payload.mobileNumber,
    age: payload.age,
    province: payload.province,
    city: payload.city,
    school: payload.school,
    course_program: payload.courseProgram,
    year_level: payload.yearLevel,
    interests: payload.interests,
    other_interest: payload.otherInterest || null,
    goals: payload.goals,
    other_goal: payload.otherGoal || null,
    additional_notes: payload.additionalNotes || null,
    building_status: payload.buildingStatus,
    project_name: payload.projectName || null,
    project_description: payload.projectDescription || null,
    collaboration_needs: payload.collaborationNeeds ?? [],
    other_collaboration_need: payload.otherCollaborationNeed || null,
    agreed_to_terms: payload.agreedToTerms,
    consented_at: new Date().toISOString(),
    status: 'pending',
    reviewed_at: null,
    reviewed_by: null,
    review_notes: null,
    invite_sent_at: null,
    auth_user_id: null,
  };
}

/**
 * Whether this email has already registered.
 *
 * Deliberately NOT a SELECT against `members`. The public key has no read
 * policy — by design, so nobody can enumerate members — so a lookup always
 * comes back empty and would report "not a duplicate" for everyone, while
 * costing a network round-trip on every step.
 *
 * The unique index on `email` is the real check, and it runs on insert. This
 * exists so the caller has one honest place to ask, and returns null meaning
 * "cannot know from the client".
 */
export async function checkEmailRegistered(): Promise<null> {
  return null;
}

/**
 * Submits a registration. Abstracted behind this single function so the
 * backend (Supabase today) can be swapped later without touching any
 * component or form logic.
 */
async function submitViaFunction(
  payload: RegistrationPayload,
  captchaToken: string,
): Promise<RegistrationResult> {
  const response = await fetch(`${env.supabaseUrl}/functions/v1/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.supabaseAnonKey,
    },
    body: JSON.stringify({ token: captchaToken, registration: toRow(payload) }),
  });

  if (response.ok) return { success: true };

  const detail = (await response.json().catch(() => ({}))) as { error?: string };
  if (detail.error === 'duplicate') {
    return {
      success: false,
      duplicate: true,
      error:
        "You've already registered with this email — hang tight, we'll be in touch once your application is reviewed.",
    };
  }
  if (detail.error === 'captcha_failed' || detail.error === 'captcha_required') {
    return {
      success: false,
      error: 'The anti-spam check did not pass. Please try the checkbox again.',
    };
  }
  return { success: false, error: 'Something went wrong submitting your registration. Please try again.' };
}

export async function submitRegistration(
  payload: RegistrationPayload,
  captchaToken?: string | null,
): Promise<RegistrationResult> {
  // With Turnstile configured the insert goes through the Edge Function, which
  // verifies the token before writing. Without it, the direct insert path is
  // kept so the site keeps working before Turnstile is set up.
  if (env.isCaptchaEnabled) {
    if (!captchaToken) {
      return { success: false, error: 'Please complete the anti-spam check first.' };
    }
    try {
      return await submitViaFunction(payload, captchaToken);
    } catch {
      return { success: false, error: 'Something went wrong submitting your registration. Please try again.' };
    }
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      success: false,
      error:
        'Registration is temporarily unavailable — the database isn\'t configured yet. Please try again shortly.',
    };
  }

  const { error } = await supabase.from('members').insert(toRow(payload));

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return {
        success: false,
        duplicate: true,
        error:
          "You've already registered with this email — hang tight, we'll be in touch once your application is reviewed.",
      };
    }
    return {
      success: false,
      error: 'Something went wrong submitting your registration. Please try again.',
    };
  }

  return { success: true };
}
