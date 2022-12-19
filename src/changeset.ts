import { join } from 'https://deno.land/std@0.168.0/path/mod.ts';
import HumanHasher from 'npm:humanhash@1.0.4';
import { list } from './modules.ts';

type ChangeType = 'patch' | 'minor' | 'major';

export function _buildChangeset(
  modules: { name: string; change: ChangeType }[],
  description: string,
): string {
  return `---
${modules.map((mod) => `'${mod.name}': ${mod.change}`).join('\n')}
---

${description}
`;
}

export async function changeset(path: string) {
  const repository = await list(path);
  const humanhash = new HumanHasher();

  return {
    create: async (
      modules: { name: string; change: ChangeType }[],
      description: string,
    ) => {
      modules.forEach(({ name }) => {
        if (!repository.modules.find((mod) => mod.name === name)) {
          throw new Error('invariant: module not found');
        }
      });

      const outputFolder = join(path, '.changeset');
      const content = _buildChangeset(modules, description);
      const filename = humanhash.humanize(content, 3, '_') + '.md';

      await Deno.mkdir(outputFolder, { recursive: true });

      await Deno.writeTextFile(
        join(outputFolder, filename),
        content,
        { createNew: true },
      );
    },
    deleteAll: async () => {
      await Deno.remove(join(path, '.changeset'), { recursive: true });
    },
  };
}
