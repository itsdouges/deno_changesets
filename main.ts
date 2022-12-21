import { Command } from 'https://deno.land/x/cliffy@v0.25.6/command/mod.ts';
import {
  Checkbox,
  Confirm,
  Input,
  prompt,
  Select,
} from 'https://deno.land/x/cliffy@v0.25.6/prompt/mod.ts';
import { lt } from 'https://deno.land/std@0.170.0/semver/mod.ts';
import { list } from './src/modules.ts';
import { changeset } from './src/changeset.ts';
import { ChangeType, changeTypes } from './src/types.ts';
import { release } from './src/release.ts';
import * as git from './src/git.ts';

if (import.meta.main) {
  const result = /@(\d\.\d\.\d)/.exec(Deno.mainModule);
  const [currentVersion] = await git.tags();
  const isDevRange = lt(currentVersion, '1.0.0');
  let version = '';

  if (result) {
    version = result[1];
  } else {
    version = 'local';
  }

  await new Command()
    .name('deno_changesets')
    .version(version)
    .description('🦕 Deno native way to manage versioning and changelogs.')
    .command('create', 'Create a new changeset')
    .option(
      '--commit -C',
      'Commits the changeset after creation.',
    )
    .action(async ({ commit }) => {
      const shouldCommit = !!commit;
      const repo = await list(Deno.cwd());
      const result = await prompt([{
        name: 'modules',
        default: repo.modules.length === 1
          ? repo.modules.map((mod) => mod.name)
          : [],
        message: repo.modules.length > 1
          ? 'Select one or more modules'
          : 'Select a module',
        type: Checkbox,
        options: repo.modules.map((mod) => mod.name),
        minOptions: 1,
        search: true,
        hint: 'Each change should be a separate changeset.',
      }, {
        name: 'changeType',
        message: 'What type of change?',
        type: Select,
        options: changeTypes.map((v) => v),
        search: true,
        hint: isDevRange
          ? 'As this module is pre-1.0 all changes will be considered minor.'
          : 'Changed and removed are considered breaking.',
      }, {
        name: 'description',
        message: 'Description',
        type: Input,
        hint: 'Describe the change for humans, keep it short and concise.',
      }, {
        name: 'confirm',
        message: 'Confirm',
        type: Confirm,
        hint: shouldCommit
          ? 'Will add changeset to a commit.'
          : 'Will not add changeset to a commit.',
      }]);

      if (!result.confirm) {
        return;
      }

      if (!result.modules || !result.changeType) {
        throw new Error('invariant');
      }

      const cChangeset = await changeset(Deno.cwd());

      cChangeset.create(
        result.modules.map((mod) => ({
          name: mod,
          changeType: result.changeType as ChangeType,
        })),
        result.description || '<empty>',
        { commit: shouldCommit },
      );
    })
    .command('release', 'Release changesets')
    .option(
      '--prod-ready -P',
      'Releases a 1.0 version, will error if already 1.0 or above.',
    )
    .action(async ({ prodReady }) => {
      if (prodReady && !isDevRange) {
        throw new Error('invariant: already in production!');
      }

      const cRelease = await release(Deno.cwd());
      const nextVersion = prodReady ? '1.0.0' : cRelease.increment();
      const result = await prompt([{
        name: 'confirm',
        message: `Will publish from ${currentVersion} to ${nextVersion}`,
        type: Confirm,
      }]);

      if (result.confirm) {
        await cRelease.release(nextVersion);
      }
    })
    .parse(Deno.args);
}
