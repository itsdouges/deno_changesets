import { join } from 'https://deno.land/std@0.170.0/path/mod.ts';
import {
  Change,
  Changelog,
  parser,
  Release,
} from 'https://deno.land/x/changelog@v2.0.0/mod.ts';
import { format } from './deno.ts';
import { Changeset, ChangeType } from './types.ts';

function sortByModule(changesets: Changeset[]) {
  const changeMap: Record<
    string,
    {
      name: string;
      path: string;
      changes: { type: ChangeType; description: string }[];
    }
  > = {};

  for (const { description, modules } of changesets) {
    for (const module of modules) {
      if (!changeMap[module.name]) {
        changeMap[module.name] = {
          name: module.name,
          changes: [],
          path: module.path,
        };
      }

      changeMap[module.name].changes.push({
        type: module.changeType,
        description,
      });
    }
  }

  return Object.values(changeMap);
}

export async function upsert(
  changesets: Changeset[],
  nextVersion: string,
  { __dryRun = false, __date = new Date() } = {},
) {
  const changelogs: {
    md: string;
    path: string;
    action: 'update' | 'create';
  }[] = [];

  const moduleChanges = sortByModule(changesets);

  for (const module of moduleChanges) {
    const path = join(module.path, 'CHANGELOG.md');
    const absolutePath = join(Deno.cwd(), path);
    let changelog: Changelog;
    let action: 'update' | 'create';

    try {
      const md = await Deno.readTextFile(absolutePath);
      changelog = parser(md);
      action = 'update';
    } catch (_) {
      changelog = new Changelog(module.name);
      action = 'create';
    }

    const release = new Release(
      nextVersion,
      __date,
    );

    for (const change of module.changes) {
      release.addChange(change.type, new Change(change.description));
    }

    changelog.addRelease(
      release,
    );

    const md = await format(changelog.toString(), 'md');

    changelogs.push({
      md,
      action,
      path,
    });

    if (__dryRun) {
      // Skip persisting to the filesystem.
      continue;
    }

    await Deno.writeTextFile(absolutePath, md);
  }

  return changelogs;
}
