export const versions = ['patch', 'minor', 'major'] as const;

export type ChangeType = typeof versions[number];
