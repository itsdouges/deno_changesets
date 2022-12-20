import {
  assertEquals,
  assertRejects,
} from 'https://deno.land/std@0.170.0/testing/asserts.ts';
import {
  dirname,
  fromFileUrl,
} from 'https://deno.land/std@0.170.0/path/mod.ts';
import { list } from './modules.ts';

Deno.test(async function shouldReturnSingleModule() {
  const dir = dirname(fromFileUrl(import.meta.url)) + '/__mocks__/single';

  const actual = await list(dir);

  assertEquals(actual, {
    type: 'single',
    modules: [{ name: 'deno_changesets', path: '/src/__mocks__/single' }],
  });
});

Deno.test(async function shouldReturnMultiModule() {
  const dir = dirname(fromFileUrl(import.meta.url)) + '/__mocks__/multi';

  const actual = await list(dir);

  assertEquals(actual, { type: 'multi', modules: [] });
});

Deno.test(function shouldThrowWhenBoth() {
  const dir = dirname(fromFileUrl(import.meta.url)) +
    '/__mocks__/invalid-multi-mixed';

  assertRejects(async () => {
    await list(dir);
  });
});
