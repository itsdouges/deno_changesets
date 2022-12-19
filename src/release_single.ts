import { increment } from 'https://deno.land/std@0.170.0/semver/mod.ts';
import { changeset } from './changeset.ts';
import { tags } from './git.ts';
import { ChangeType } from './types.ts';

export async function release(path: string, __forceCurrentVersion?: string) {
  const { readAll } = await changeset(path);
  const versions = await tags();
  const changesets = await readAll();

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
    throw new Error('invariant: no changesets to release');
  }

  if (versions.length === 0) {
    // This repository has never released yet, start from 0.0.0!
    versions.push('0.0.0');
  }

  return {
    increment: () => {
      const releaseType = findReleaseType();
      const currentVersion = __forceCurrentVersion || versions[0];
      const nextVersion = increment(currentVersion, releaseType);

      if (nextVersion === null) {
        throw new Error('invariant');
      }

      return nextVersion;
    },
  };
}
