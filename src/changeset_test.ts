import {
  dirname,
  fromFileUrl,
} from 'https://deno.land/std@0.170.0/path/mod.ts';
import { _buildChangeset, changeset } from './changeset.ts';
import {
  assertEquals,
  assertRejects,
} from 'https://deno.land/std@0.170.0/testing/asserts.ts';
import { join } from 'https://deno.land/std@0.170.0/path/mod.ts';

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

Deno.test(async function shouldReturnImplicitChangesets() {
  const dir = join(Deno.cwd(), 'src/__mocks__/changeset_dependencies');
  const { readAll } = await changeset(dir);

  const changesets = await readAll();

  assertEquals(changesets, [
    {
      description: 'Removed an API, sorry!',
      modules: [
        {
          name: 'b',
          changeType: 'removed',
          path: '/src/__mocks__/changeset_dependencies/modules/b',
        },
      ],
    },
    {
      description: 'Upgraded "b" module to @{nextVersion}.',
      modules: [
        {
          changeType: 'fixed',
          name: 'a',
          path: '/src/__mocks__/changeset_dependencies/modules/a',
        },
      ],
    },
  ]);
});
