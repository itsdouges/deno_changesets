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
