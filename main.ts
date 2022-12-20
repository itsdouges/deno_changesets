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
    .command('create', 'Add a new changeset')
    .action(async () => {
      const repo = await list(Deno.cwd());
      const result = await prompt([{
        name: 'modules',
        message: 'Select module(s) to create a changeset',
        type: Checkbox,
        options: repo.modules.map((mod) => mod.name),
        minOptions: 1,
      }, {
        name: 'release_version',
        message: 'What is changing for this module(s)?',
        type: Select,
        options: changeTypes.map((v) => v),
      }, {
        name: 'description',
        message: 'Description',
        type: Input,
      }, {
        name: 'confirm',
        message: 'Confirm create',
        type: Confirm,
      }]);

      if (!result.confirm) {
        return;
      }

      if (!result.modules || !result.release_version) {
        throw new Error('invariant');
      }

      const cChangeset = await changeset(Deno.cwd());

      cChangeset.create(
        result.modules.map((mod) => ({
          name: mod,
          changeType: result.release_version as ChangeType,
        })),
        result.description || '<empty>',
      );
    })
    .command('release', 'Release changesets')
    .action(async () => {
      const cRelease = await release(Deno.cwd());
      const nextVersion = cRelease.increment();
      const result = await prompt([{
        name: 'confirm',
        message: `Release ${nextVersion}`,
        type: Confirm,
      }]);

      if (result.confirm) {
        await cRelease.release(nextVersion);
      }
    })
    .parse(Deno.args);
}
