/**
 * Domain types for a Nex Network registration.
 *
 * This shape is intentionally normalized so it can later power:
 *  - an admin/member directory with filtering (school, location, year
 *    level, interests, goals, collaboration needs)
 *  - matchmaking (e.g. "find students interested in UI/UX",
 *    "find students looking for testers")
 *  - future features (profiles, project listings, mentorship matching)
 * without changing this contract. See supabase/schema.sql for the
 * matching database structure.
 */

export const YEAR_LEVELS = [
  'Grade 11',
  'Grade 12',
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Graduate',
  'Other',
] as const;
export type YearLevel = (typeof YEAR_LEVELS)[number];

export const INTERESTS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Software Development',
  'Web Development',
  'Mobile Development',
  'Data Science',
  'IoT',
  'Robotics',
  'UI/UX Design',
  'Product Development',
  'Startups',
  'Entrepreneurship',
  'Hackathons',
  'Ideathons',
  'Pitching',
  'Research',
  'Content Creation',
  'Marketing',
  'Other',
] as const;
export type Interest = (typeof INTERESTS)[number];

export const COMMUNITY_GOALS = [
  'Learn new skills',
  'Find teammates',
  'Find collaborators',
  'Find testers for my project',
  'Build a project',
  'Join hackathons',
  'Join competitions',
  'Find opportunities',
  'Get mentorship',
  'Meet other student builders',
  'Share my project',
  'Explore technology',
  'Start a startup',
  'Other',
] as const;
export type CommunityGoal = (typeof COMMUNITY_GOALS)[number];

export const BUILDING_STATUSES = [
  'Yes',
  'Not yet',
  'I have an idea',
  "I'm looking for a project to join",
] as const;
export type BuildingStatus = (typeof BUILDING_STATUSES)[number];

export const COLLABORATION_NEEDS = [
  'Teammates',
  'Developers',
  'Designers',
  'Testers',
  'Feedback',
  'Mentors',
  'Other collaborators',
] as const;
export type CollaborationNeed = (typeof COLLABORATION_NEEDS)[number];

export interface BasicInfo {
  firstName: string;
  lastName: string;
  preferredName: string;
  email: string;
  mobileNumber: string;
  age: number;
  province: string;
  city: string;
}

export interface StudentInfo {
  school: string;
  courseProgram: string;
  yearLevel: YearLevel;
}

export interface InterestsInfo {
  interests: Interest[];
  otherInterest?: string;
}

export interface GoalsInfo {
  goals: CommunityGoal[];
  otherGoal?: string;
  additionalNotes?: string;
}

export interface BuilderProfile {
  buildingStatus: BuildingStatus | null;
  projectName?: string;
  projectDescription?: string;
  collaborationNeeds?: CollaborationNeed[];
  otherCollaborationNeed?: string;
}

export interface ConsentInfo {
  agreedToTerms: boolean;
}

/** The complete, assembled registration payload submitted to the backend. */
export interface RegistrationPayload
  extends BasicInfo,
    StudentInfo,
    InterestsInfo,
    GoalsInfo,
    BuilderProfile,
    ConsentInfo {}

export interface RegistrationResult {
  success: boolean;
  error?: string;
  /** True when the email already exists — a friendlier duplicate-submit message. */
  duplicate?: boolean;
}
