import { getSupabaseClient } from '@/lib/supabaseClient';
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
    // Registrations always enter the review queue. The RLS policy in
    // supabase/schema.sql enforces this too, so a tampered client can't
    // self-approve its way to an invite.
    status: 'pending',
    reviewed_at: null,
    reviewed_by: null,
    review_notes: null,
    invite_sent_at: null,
    auth_user_id: null,
  };
}

/**
 * Submits a registration. Abstracted behind this single function so the
 * backend (Supabase today) can be swapped later without touching any
 * component or form logic.
 */
export async function submitRegistration(payload: RegistrationPayload): Promise<RegistrationResult> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      success: false,
      error:
        'Registration is temporarily unavailable — the database isn\'t configured yet. Please try again shortly.',
    };
  }

  // Deliberately no .select() chained onto the insert. Doing so sets
  // PostgREST's `Prefer: return=representation`, which reads the new row back
  // — and there is no SELECT policy for the public key, so that read is denied
  // and the whole insert rolls back, surfacing as a confusing
  // "42501: new row violates row-level security policy". Registration does not
  // need the generated id, so the tighter policy wins.
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
