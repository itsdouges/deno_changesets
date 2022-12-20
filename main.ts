import { Command } from 'https://deno.land/x/cliffy@v0.25.5/command/mod.ts';
import {
  Checkbox,
  Confirm,
  Input,
  prompt,
  Select,
} from 'https://deno.land/x/cliffy@v0.25.5/prompt/mod.ts';
import { list } from './src/modules.ts';
import { changeset } from './src/changeset.ts';
import { ChangeType, changeTypes } from './src/types.ts';
import { release } from './src/release_single.ts';
import { tags } from './src/git.ts';

if (import.meta.main) {
  let version = '';
  const result = /@(\d\.\d\.\d)/.exec(Deno.mainModule);
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
    .action(async () => {
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
      }, {
        name: 'changeType',
        message: 'What type of change?',
        type: Select,
        options: changeTypes.map((v) => v),
        search: true,
      }, {
        name: 'description',
        message: 'Description',
        type: Input,
      }, {
        name: 'confirm',
        message: 'Confirm',
        type: Confirm,
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
      );
    })
    .command('release', 'Release changesets')
    .action(async () => {
      const [currentVersion] = await tags();
      const cRelease = await release(Deno.cwd());
      const nextVersion = cRelease.increment();
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
