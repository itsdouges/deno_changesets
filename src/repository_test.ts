import {
  assertEquals,
  assertRejects,
} from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import {
  dirname,
  fromFileUrl,
} from 'https://deno.land/std@0.168.0/path/mod.ts';
import { repositoryType } from './repository.ts';

Deno.test(async function shouldReturnSingleModule() {
  const dir = await Deno.readDir(
    dirname(fromFileUrl(import.meta.url)) + '/__mocks__/single',
  );

  const actual = await repositoryType(dir);

  assertEquals(actual, 'single-module');
});

Deno.test(async function shouldReturnMultiModule() {
  const dir = await Deno.readDir(
    dirname(fromFileUrl(import.meta.url)) + '/__mocks__/multi',
  );

  const actual = await repositoryType(dir);

  assertEquals(actual, 'multi-module');
});

Deno.test(async function shouldThrowWhenBoth() {
  const dir = await Deno.readDir(
    dirname(fromFileUrl(import.meta.url)) + '/__mocks__/invalid-multi-mixed',
  );

  assertRejects(async () => {
    await repositoryType(dir);
  });
});
