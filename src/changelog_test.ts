import { join } from 'https://deno.land/std@0.170.0/path/mod.ts';
import { assertSnapshot } from 'https://deno.land/std@0.170.0/testing/snapshot.ts';
import { upsert } from './changelog.ts';
import { changeset } from './changeset.ts';

Deno.test(async function shouldCreateChangelog(t) {
  const path = join(Deno.cwd(), 'src/__mocks__/changeset_patch');
  const manager = await changeset(path);
  const changesets = await manager.readAll();

  const actual = await upsert(changesets, '0.0.2', {
    __dryRun: true,
    __date: new Date('2000-01-01'),
  });

  await assertSnapshot(t, actual);
});

Deno.test(async function shouldUpdateChangelog(t) {
  const path = join(Deno.cwd(), 'src/__mocks__/changeset_major');
  const manager = await changeset(path);
  const changesets = await manager.readAll();

  const actual = await upsert(changesets, '1.0.0', {
    __dryRun: true,
    __date: new Date('2000-10-01'),
  });

  await assertSnapshot(t, actual);
});
