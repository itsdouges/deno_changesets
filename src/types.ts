export const versions = ['patch', 'minor', 'major'] as const;

export type ChangeType = typeof versions[number];

export interface Changeset {
  modules: { name: string; path: string; version: ChangeType }[];
  description: string;
}
