import { basename } from 'https://deno.land/std@0.168.0/path/mod.ts';

export async function name(): Promise<string> {
  const p = Deno.run({
    cmd: ['git', 'rev-parse', '--show-toplevel'],
    stdout: 'piped',
  });

  const result = await p.status();

  if (!result.success) {
    throw new Error('invariant');
  }

  const output = await p.output();

  p.close();

  return basename(new TextDecoder().decode(output)).replace('\n', '');
}

export async function tags(): Promise<string[]> {
  const p = Deno.run({
    cmd: ['git', 'tag', '--sort=-version:refname'],
    stdout: 'piped',
  });

  const result = await p.status();

  if (!result.success) {
    throw new Error('invariant');
  }

  const output = await p.output();

  p.close();

  return new TextDecoder().decode(output).split('\n').filter(Boolean);
}

export async function createTag(tag: string): Promise<void> {
  const p = Deno.run({
    cmd: ['git', 'tag', tag],
  });

  const result = await p.status();

  if (!result.success) {
    throw new Error('invariant');
  }
}

export async function push({ tags = false } = {}): Promise<void> {
  const p = Deno.run({
    cmd: ['git', 'push', tags ? '--tags' : ''],
  });

  const result = await p.status();

  if (!result.success) {
    throw new Error('invariant');
  }
}

export async function add(): Promise<void> {
  const p = Deno.run({
    cmd: ['git', 'add', '.'],
  });

  const result = await p.status();

  if (!result.success) {
    throw new Error('invariant');
  }
}
