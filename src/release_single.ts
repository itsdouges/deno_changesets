import { increment } from 'https://deno.land/std@0.170.0/semver/mod.ts';
import { changeset } from './changeset.ts';
import * as git from './git.ts';
import * as changelog from './changelog.ts';
import { ChangeType } from './types.ts';

export async function release(path: string, { __dryRun = false } = {}) {
  const name = await git.branchName();
  if (!['main', 'master'].includes(name)) {
    throw new Error('invariant: must be ran on primary branch');
  }

  const changesetManager = await changeset(path);
  const versions = await git.tags();
  const changesets = await changesetManager.readAll();

  function findReleaseType(): ChangeType {
    const versions: Record<ChangeType, boolean> = {
      major: false,
      minor: false,
      patch: false,
    };

    changesets.forEach((change) => {
      change.modules.forEach((mod) => {
        versions[mod.version] = true;
      });
    });

    if (versions.major) {
      return 'major';
    }

    if (versions.minor) {
      return 'minor';
    }

    if (versions.patch) {
      return 'patch';
    }

    throw new Error('invariant');
  }

  if (!changesets.length) {
    // Nothing to do.
    throw new Error('invariant: no changesets');
  }

  const dirty = await git.isDirty();
  if (!__dryRun && dirty) {
    throw new Error('invariant: dirty git');
  }

  if (versions.length === 0) {
    // This repository has never released yet, start from 0.0.0!
    versions.push('0.0.0');
  }

  return {
    increment: () => {
      const releaseType = findReleaseType();
      const currentVersion = __dryRun ? '0.0.0' : versions[0];
      const nextVersion = increment(currentVersion, releaseType);
      if (nextVersion === null) {
        throw new Error('invariant');
      }

      return nextVersion;
    },
    release: async (version: string) => {
      if (__dryRun) {
        return;
      }

      await changelog.upsert(changesets);
      await changesetManager.deleteAll();
      await git.add();
      await git.commit('Version Modules');
      await git.push();
      await git.createTag(version);
      await git.push({ tags: true });
    },
  };
}
