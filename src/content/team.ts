import { content } from './index';

export const TEAM = content.team;
/** Natural size of the team portraits (4:5). */
export const PHOTO_SIZE: Record<string, { w: number; h: number }> = {
  '/photos/subbaiah.jpg': { w: 752, h: 940 },
  '/photos/madeswaran.jpg': { w: 898, h: 1122 },
  '/photos/parthesh.jpg': { w: 869, h: 1086 },
  '/photos/harish.jpg': { w: 717, h: 896 },
};
