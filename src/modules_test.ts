import {
  assertEquals,
  assertRejects,
} from 'https://deno.land/std@0.170.0/testing/asserts.ts';
import { assertSnapshot } from 'https://deno.land/std@0.170.0/testing/snapshot.ts';
import { join } from 'https://deno.land/std@0.170.0/path/mod.ts';
import { list, updateVersion } from './modules.ts';

Deno.test(async function shouldReturnSingleModule() {
  const dir = join(Deno.cwd(), '/src/__mocks__/single');

  const actual = await list(dir);

  assertEquals(actual, {
    type: 'single',
    modules: [{ name: 'deno_changesets', path: '/src/__mocks__/single' }],
  });
});

Deno.test(async function shouldReturnMultiModule() {
  const dir = join(Deno.cwd(), '/src/__mocks__/multi');

  const actual = await list(dir);

  assertEquals(actual, {
    type: 'multi',
    modules: [{
      name: 'a',
      path: '/src/__mocks__/multi/modules/a',
    }, {
      name: 'b',
      path: '/src/__mocks__/multi/modules/b',
    }],
  });
});

Deno.test(function shouldThrowWhenBoth() {
  const dir = join(Deno.cwd(), '/src/__mocks__/invalid-multi-mixed');

  assertRejects(async () => {
    await list(dir);
  });
});

Deno.test(function shouldThrowWhenMultiModuleHasTopLevelFiles() {
  const dir = join(Deno.cwd(), '/src/__mocks__/invalid_multi_file');

  assertRejects(async () => {
    await list(dir);
  });
});

Deno.test(async function shouldUpdateAllFilesWithNewModuleVersion(t) {
  const actual = await updateVersion(
    join(Deno.cwd(), 'src/__mocks__/multi'),
    'b',
    '1.1.1',
    { dryRun: true },
  );

  actual.sort();

  await assertSnapshot(t, actual.find((file) => file.file.includes('imports')));
  await assertSnapshot(
    t,
    actual.find((file) => !file.file.includes('imports')),
  );
});
