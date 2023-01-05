import { join } from 'https://deno.land/std@0.170.0/path/mod.ts';
import { assertSnapshot } from 'https://deno.land/std@0.170.0/testing/snapshot.ts';
import { assertStringIncludes } from 'https://deno.land/std@0.170.0/testing/asserts.ts';
import { upsert } from './changelog.ts';
import { changeset } from './changeset.ts';
import { Changeset } from './types.ts';

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

Deno.test(async function shouldReplaceDescriptionVariables() {
  const changesets: Changeset[] = [{
    description: 'Upgraded to @{nextVersion}',
    modules: [{ changeType: 'fixed', name: 'a', path: 'src/a' }],
  }];

  const actual = await upsert(changesets, '1.0.0', {
    __dryRun: true,
    __date: new Date('2000-10-01'),
  });

  assertStringIncludes(actual[0].md, 'Upgraded to 1.0.0');
});
