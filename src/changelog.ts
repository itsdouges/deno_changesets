import { parser } from 'https://deno.land/x/changelog@v2.0.0/mod.ts';
import { Changeset } from './types.ts';

export async function upsert(changesets: Changeset[]) {
  for (const { description, modules } of changesets) {
    for (const module of modules) {
    }
  }
}
