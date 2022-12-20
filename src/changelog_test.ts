import { join } from 'https://deno.land/std@0.170.0/path/mod.ts';
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';
import { upsert } from './changelog.ts';
import { changeset } from './changeset.ts';

Deno.test(async function shouldCreateChangelog() {
  const path = join(Deno.cwd(), 'src/__mocks__/changeset_patch');
  const manager = await changeset(path);
  const changesets = await manager.readAll();
  const expected = await Deno.readTextFile(join(path, 'CHANGELOG.md'));

  const actual = await upsert(changesets, '0.0.2', {
    __dryRun: true,
    __date: new Date('2000-01-01'),
  });

  assertEquals(actual, [{
    action: 'create',
    md: expected,
    path: '/src/__mocks__/changeset_patch/CHANGELOG.md',
  }]);
});

Deno.test(function shouldUpdateChangelog() {});
