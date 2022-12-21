import { join } from 'https://deno.land/std@0.170.0/path/mod.ts';
import { name } from './git.ts';

const topLevelModuleNames = /(main|index|mod)\.(js|ts)x?$/;

export interface Module {
  name: string;
  path: string;
}

export interface Repository {
  type: 'multi' | 'single';
  modules: Module[];
}

export async function list(
  path: string,
): Promise<Repository> {
  const foundModules: string[] = [];
  const stats = {
    hasTopLevelModule: false,
    hasModulesFolder: false,
  };

  for await (const dirEntry of Deno.readDir(path)) {
    if (dirEntry.isFile && topLevelModuleNames.exec(dirEntry.name)) {
      stats.hasTopLevelModule = true;
    }

    if (dirEntry.isDirectory && dirEntry.name === 'modules') {
      stats.hasModulesFolder = true;

      for await (const dirEntry of Deno.readDir(join(path, 'modules'))) {
        if (!dirEntry.isDirectory) {
          throw new Error(
            'invariant: children of modules folder must be folders',
          );
        }

        if (dirEntry.isFile && topLevelModuleNames.exec(dirEntry.name)) {
          stats.hasTopLevelModule = true;
        }

        foundModules.push(dirEntry.name);
      }
    }
  }

  if (stats.hasModulesFolder && stats.hasTopLevelModule) {
    throw new Error(
      'repository should have either a top level module or nested ones inside a modules folder, but not both.',
    );
  }

  if (stats.hasTopLevelModule) {
    return {
      type: 'single',
      modules: [{ name: await name(), path: path.replace(Deno.cwd(), '') }],
    };
  }

  if (stats.hasModulesFolder) {
    return {
      type: 'multi',
      modules: foundModules.map((mod) => ({
        name: mod,
        path: join(path.replace(Deno.cwd(), ''), 'modules', mod),
      })),
    };
  }

  throw new Error('invariant');
}
