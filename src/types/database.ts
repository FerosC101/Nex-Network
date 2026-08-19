/**
 * Hand-written mirror of supabase/schema.sql's `members` table, typed for
 * the Supabase JS client. If the schema evolves, regenerate this with the
 * Supabase CLI (`supabase gen types typescript`) or update it by hand to
 * match — the two must stay in sync.
 *
 * These are `type` aliases rather than `interface`s on purpose: the
 * Supabase client's generics check each table's Row/Insert/Update against
 * `Record<string, unknown>`, and only object-literal type aliases satisfy
 * that structurally — interfaces don't (this matches the shape the
 * Supabase CLI itself generates).
 */

/**
 * Where a registration sits in the review queue. Rows are created as
 * 'pending'; the Nex team verifies the applicant is a Batangas student
 * before flipping to 'approved' and emailing the group chat invite.
 */
export type MemberStatus = 'pending' | 'approved' | 'rejected';

export type MembersRow = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string;
  mobile_number: string;
  age: number;
  province: string;
  city: string;
  school: string;
  course_program: string;
  year_level: string;
  interests: string[];
  other_interest: string | null;
  goals: string[];
  other_goal: string | null;
  additional_notes: string | null;
  building_status: string | null;
  project_name: string | null;
  project_description: string | null;
  collaboration_needs: string[];
  other_collaboration_need: string | null;
  agreed_to_terms: boolean;
  consented_at: string | null;
  status: MemberStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  invite_sent_at: string | null;
  auth_user_id: string | null;
};

export type MembersInsert = Omit<MembersRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type Database = {
  public: {
    Tables: {
      members: {
        Row: MembersRow;
        Insert: MembersInsert;
        Update: Partial<MembersInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
