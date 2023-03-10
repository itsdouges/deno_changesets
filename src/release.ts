import { increment, lt } from 'https://deno.land/std@0.170.0/semver/mod.ts';
import { changeset } from './changeset.ts';
import * as git from './git.ts';
import * as changelog from './changelog.ts';
import { changeTypeToSemVer, SemVer } from './types.ts';
import { list, updateVersion } from './modules.ts';

export async function release(
  path: string,
  { dryRun = false, __forceVersion = '' } = {},
) {
  const name = await git.branchName();
  if (!dryRun && !['main', 'master'].includes(name)) {
    throw new Error('invariant: must be ran on primary branch');
  }

  const changesetManager = await changeset(path);
  const versions = await git.tags();

  if (versions.length === 0) {
    versions.push('0.0.0');
  }

  const latestVersion = __forceVersion || versions[0];
  const changesets = await changesetManager.readAll();

  function findSemVerChange(): SemVer {
    if (lt(latestVersion, '1.0.0')) {
      // Every release during the development phase should be a minor release for simplicity.
      // https://semver.org/#how-should-i-deal-with-revisions-in-the-0yz-initial-development-phase
      return 'minor';
    }

    const semver: Record<SemVer, boolean> = {
      major: false,
      minor: false,
      patch: false,
    };

    changesets.forEach((change) => {
      change.modules.forEach((mod) => {
        semver[changeTypeToSemVer[mod.changeType]] = true;
      });
    });

    if (semver.major) {
      return 'major';
    }

    if (semver.minor) {
      return 'minor';
    }

    if (semver.patch) {
      return 'patch';
    }

    throw new Error('invariant');
  }

  if (!changesets.length) {
    // Nothing to do.
    throw new Error('invariant: no changesets');
  }

  const dirty = await git.isDirty();
  if (!dryRun && dirty) {
    throw new Error('invariant: dirty git');
  }

  return {
    increment: () => {
      const semVerChange = findSemVerChange();
      const nextVersion = increment(latestVersion, semVerChange);
      if (nextVersion === null) {
        throw new Error('invariant');
      }

      return nextVersion;
    },
    release: async (nextVersion: string) => {
      if (dryRun) {
        return;
      }

      const repo = await list(path);

      await changelog.upsert(changesets, nextVersion);
      await changesetManager.deleteAll();

      if (repo.type === 'multi') {
        for (const mod of repo.modules) {
          await updateVersion(path, mod.name, nextVersion);
        }
      }

      await git.add();
      await git.commit('Version Modules');
      await git.push();
      await git.createTag(nextVersion);
      await git.push({ tags: true });
    },
  };
}
