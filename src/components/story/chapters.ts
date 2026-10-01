/**
 * The chapters of the Nex story, in page order, and the section ids each one
 * spans. Drives the navbar's chapter label and the side progress indicator.
 */
export const CHAPTERS = [
  { number: '01', label: 'Intro', ids: ['top'] },
  { number: '02', label: 'Community', ids: ['community', 'talent'] },
  { number: '03', label: 'Build', ids: ['enables', 'idea'] },
  { number: '04', label: 'Opportunities', ids: ['opportunities'] },
  { number: '05', label: 'Events', ids: ['events'] },
  { number: '06', label: 'People', ids: ['people', 'network'] },
  { number: '07', label: 'Join', ids: ['join', 'register'] },
] as const;
