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
    return { type: 'multi', modules: [] };
  }

  throw new Error('invariant');
}
