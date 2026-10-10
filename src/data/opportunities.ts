/**
 * Opportunities shown in the Opportunities chapter. Real ones only — add new
 * entries at the top, newest first. Whether each is upcoming or done is
 * worked out from its date, so nothing needs editing after it happens.
 */

export interface Opportunity {
  title: string;
  /** Who runs it. */
  organizer: string;
  category: string;
  /** Machine-readable date (local, YYYY-MM-DD). */
  dateTime: string;
  /** Human time window, e.g. "9:00–10:00 PM". */
  time?: string;
  /**
   * When it ends, with the Philippine offset (+08:00) so it flips to
   * "Completed" at the right moment wherever the visitor is. Without it, the
   * end of the day is used.
   */
  endsAt?: string;
  location: string;
  /** e.g. "Members only". */
  access?: string;
  description: string;
  poster?: { src: string; alt: string };
  /** The matching entry in Events, once it has happened. */
  eventTitle?: string;
}

export const OPPORTUNITIES: Opportunity[] = [
  {
    title: 'NASA Space Apps Challenge Mentoring Session',
    organizer: 'NASA Space Apps Challenge × Nex Network',
    category: 'Hackathon mentoring',
    dateTime: '2026-10-10',
    time: '9:00–10:00 PM',
    endsAt: '2026-10-10T22:00:00+08:00',
    location: 'Online · Google Meet',
    access: 'Members only',
    description:
      'Coaching for the NASA Space Apps Challenge with Helen Mary Labapo-Barrameda — licensed geodetic engineer, 2020 NASA Space Apps hackathon winner, and IT and FinOps professional.',
    poster: {
      src: '/opportunities/nasa-space-apps-coach.jpg',
      alt: 'Poster: Meet our coach, Helen Mary Labapo-Barrameda — NASA Space Apps Challenge mentoring session, October 10, 2026, 9–10 PM via Google Meet, exclusive for community members',
    },
    eventTitle: 'NASA Space Apps Challenge Mentoring Session',
  },
];

/** True once the opportunity has ended. */
export function isPast(o: Opportunity, now = new Date()) {
  const end = new Date(o.endsAt ?? `${o.dateTime}T23:59:59+08:00`);
  return now > end;
}
