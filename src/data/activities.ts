/**
 * Nex events and activities, shown in the Events section and counted in the
 * network stats. Real events only — add new ones at the end.
 */

export interface Photo {
  src: string;
  alt: string;
  /** Where to anchor the crop, for photos whose faces sit near an edge. */
  position?: string;
}

export interface Activity {
  title: string;
  date: string;
  /** Machine-readable date for the <time> element. */
  dateTime: string;
  place: string;
  description: string;
  /** Shown in turn on the card, starting with the first. */
  photos: Photo[];
  podium?: { place: string; name: string }[];
  podiumNote?: string;
}

// Oldest first, in the order the team asked for. New activities go at the end;
// the row scrolls sideways once there are more than fit on screen.
export const ACTIVITIES: Activity[] = [
  {
    title: 'AWS Student Community Day Mega Manila',
    date: 'September 11, 2026',
    dateTime: '2026-09-11',
    place: 'Pacific College Makati, Manila',
    description:
      'Nex members headed to Manila to network with fellow student builders and learn about cloud computing on AWS.',
    photos: [
      // The Nex group leads: at card size the full auditorium reads as a crowd.
      {
        src: '/activities/aws-2.jpg',
        alt: 'Nex members posing together at AWS Student Community Day',
      },
      {
        src: '/activities/aws-3.jpg',
        alt: 'A full auditorium of attendees making heart signs in front of an AWS "Thank you so much everyone" slide',
      },
      {
        src: '/activities/aws-1.jpg',
        alt: 'A group selfie of Nex members on stage at the event',
        position: 'center 30%',
      },
    ],
  },
  {
    title: 'Code Golf',
    date: 'September 28, 2026',
    dateTime: '2026-09-28',
    place: 'Bluemoon Cafe',
    description:
      'Members went head to head to write the shortest possible Python solution to each problem — fewest characters wins.',
    photos: [
      {
        src: '/activities/code-golf-2.jpg',
        alt: 'The top three finishers holding a laptop that reads "Code Golf Champion"',
      },
      {
        src: '/activities/code-golf-1.jpg',
        alt: 'Members coding on laptops at the cafe during the competition',
      },
      {
        src: '/activities/code-golf-3.jpg',
        alt: 'A group selfie of Code Golf participants around the table',
      },
    ],
    podium: [
      { place: '1st', name: 'Gadiel Manalo' },
      { place: '2nd', name: 'Edzel Manalo' },
      { place: '3rd', name: 'Jed Balita' },
    ],
    podiumNote: 'All three took home cash prizes.',
  },
];
