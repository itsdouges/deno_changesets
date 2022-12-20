import {
  dirname,
  fromFileUrl,
} from 'https://deno.land/std@0.170.0/path/mod.ts';
import { _buildChangeset, changeset } from './changeset.ts';
import {
  assertEquals,
  assertRejects,
} from 'https://deno.land/std@0.170.0/testing/asserts.ts';

Deno.test(async function shouldThrowCreatingChangesetWithUnknownModule() {
  const dir = dirname(fromFileUrl(import.meta.url)) + '/__mocks__/single';
  const { create } = await changeset(dir);

  assertRejects(async () => {
    await create([{ name: 'unknown', changeType: 'fixed' }], 'Fix bug');
  });
});

Deno.test(function shouldBuildChangeset() {
  const actual = _buildChangeset(
    [{ name: 'deno_changesets', changeType: 'fixed' }],
    'Fix bug',
  );

  assertEquals(
    actual,
    `---
'deno_changesets': fixed
---

Fix bug
`,
  );
});

Deno.test(async function shouldParseChangesets() {
  const dir = dirname(fromFileUrl(import.meta.url)) +
    '/__mocks__/changeset_patch';
  const { readAll } = await changeset(dir);

  const actual = await readAll();

  assertEquals(actual, [{
    modules: [{
      name: 'deno_changesets',
      changeType: 'fixed',
      path: '/src/__mocks__/changeset_patch',
    }],
    description: 'Fixed an oops, sorry!',
  }]);
});

Deno.test(async function shouldCreateChangeset(t) {
  const dir = dirname(fromFileUrl(import.meta.url)) + '/__mocks__/single';

  const { create, deleteAll } = await changeset(dir);

  await t.step('create', async () => {
    await create([{ name: 'deno_changesets', changeType: 'fixed' }], 'Fix bug');
  });

  try {
    await deleteAll();
  } catch (_) {
    //
  }
});
