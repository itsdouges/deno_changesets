import { join } from 'https://deno.land/std@0.170.0/path/mod.ts';
import HumanHasher from 'npm:humanhash@1.0.4';
import fm from 'npm:front-matter@4.0.2';
import * as modules from './modules.ts';
import { Changeset, ChangeType, versions } from './types.ts';

const frontmatter = fm as unknown as typeof fm.default;

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
  const humanhash = new HumanHasher();
  const repository = await modules.list(path);
  const outputFolder = join(path, '.changeset');

  function moduleInvariant(name: string) {
    if (!repository.modules.find((mod) => mod.name === name)) {
      throw new Error('invariant: module not found');
    }
  }

  function versionInvariant(version: ChangeType) {
    if (!versions.includes(version)) {
      throw new Error(`invariant: version must be one of ${versions}`);
    }
  }

  return {
    create: async (
      modules: { name: string; change: ChangeType }[],
      description: string,
    ) => {
      modules.forEach(({ name }) => moduleInvariant(name));

      const content = _buildChangeset(modules, description);
      const filename = humanhash.humanize(content, 3, '_') + '.md';

      await Deno.mkdir(outputFolder, { recursive: true });

      await Deno.writeTextFile(
        join(outputFolder, filename),
        content,
        { createNew: true },
      );
    },
    readAll: async (): Promise<Changeset[]> => {
      const changesets: Changeset[] = [];

      for await (const dirEntry of Deno.readDir(outputFolder)) {
        if (!dirEntry.isFile) {
          throw new Error('invariant');
        }

        const contents = await Deno.readTextFile(
          join(outputFolder, dirEntry.name),
        );
        const parsed = frontmatter<Record<string, ChangeType>>(contents);
        const moduleMap = repository.modules.reduce<
          Record<string, modules.Module>
        >((acc, obj) => Object.assign(acc, { [obj.name]: obj }), {});

        changesets.push({
          description: parsed.body.trim(),
          modules: Object.entries(parsed.attributes).map(([name, version]) => {
            moduleInvariant(name);
            versionInvariant(version);

            return {
              name,
              version: version,
              path: moduleMap[name].path,
            };
          }),
        });
      }

      return changesets;
    },
    deleteAll: async () => {
      await Deno.remove(join(path, '.changeset'), { recursive: true });
    },
  };
}
