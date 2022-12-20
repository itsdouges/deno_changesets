export const changeTypes = [
  'added',
  'changed',
  'deprecated',
  'removed',
  'fixed',
  'security',
] as const;

export type SemVer = 'patch' | 'minor' | 'major';

export const changeTypeToSemVer: Record<ChangeType, SemVer> = {
  added: 'minor',
  changed: 'major',
  deprecated: 'minor',
  fixed: 'patch',
  removed: 'major',
  security: 'patch',
};

export type ChangeType = typeof changeTypes[number];

export interface Changeset {
  modules: {
    name: string;
    path: string;
    changeType: ChangeType;
  }[];
  description: string;
}
