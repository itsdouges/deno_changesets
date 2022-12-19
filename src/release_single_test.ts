import { join } from 'https://deno.land/std@0.168.0/path/mod.ts';
import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { release } from './release_single.ts';

Deno.test(async function shouldIncrementByPatch() {
  const path = join(Deno.cwd(), 'src/__mocks__/changeset_patch');
  const { increment } = await release(path, '0.1.0');

  const actual = increment();

  assertEquals(actual, '0.1.1');
});

Deno.test(async function shouldIncrementByMinor() {
  const path = join(Deno.cwd(), 'src/__mocks__/changeset_minor');
  const { increment } = await release(path, '0.0.1');

  const actual = increment();

  assertEquals(actual, '0.1.0');
});

Deno.test(async function shouldIncrementByMajor() {
  const path = join(Deno.cwd(), 'src/__mocks__/changeset_major');
  const { increment } = await release(path, '0.0.1');

  const actual = increment();

  assertEquals(actual, '1.0.0');
});

Deno.test(function shouldUpdateChangelog() {});

Deno.test(function shouldDeleteChangesets() {});
