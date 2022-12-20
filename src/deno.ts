export async function format(
  text: string,
  type: 'md' | 'ts' | 'tsx' | 'json' | 'jsonc',
): Promise<string> {
  const p = Deno.run({
    cmd: ['bash'],
    stdout: 'piped',
    stdin: 'piped',
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const command = `echo "${text}" | deno fmt --ext ${type} -`;

  await p.stdin.write(encoder.encode(command));
  await p.stdin.close();

  const output = await p.output();

  p.close();

  return decoder.decode(output);
}
