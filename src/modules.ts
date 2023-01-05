import { extname, join } from 'https://deno.land/std@0.170.0/path/mod.ts';
import { recursiveReaddir } from 'https://deno.land/x/recursive_readdir@v2.0.0/mod.ts';
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

const importMatcher = (name: string) => {
  return new RegExp(
    `https://deno.land/x/${name}(@v?\\d\.\\d\.\\d)?/`,
    'g',
  );
};

const readAllFiles = async (path: string, excludeJson = false) => {
  const files = (await recursiveReaddir(path)).filter((file) =>
    excludeJson
      ? /(ts|js)x?$/.exec(extname(file))
      : /(ts|js|json)x?$/.exec(extname(file))
  );

  return files;
};

export async function updateVersion(
  path: string,
  name: string,
  version: string,
  { dryRun = false } = {},
) {
  const files = await readAllFiles(path);
  const updatedFiles: { path: string; file: string }[] = [];
  const regex = importMatcher(name);
  const newImportSpecifier = `https://deno.land/x/${name}@${version}/`;

  for (const filePath of files) {
    const file = await Deno.readTextFile(filePath);
    if (file.indexOf(`https://deno.land/x/${name}`) === -1) {
      continue;
    }

    const newFile = file.replaceAll(regex, newImportSpecifier);
    updatedFiles.push({
      path: filePath.replace(Deno.cwd(), ''),
      file: newFile,
    });

    if (dryRun) {
      continue;
    }

    await Deno.writeTextFile(filePath, newFile, { create: true });
  }

  return updatedFiles;
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

interface ModuleDependencies {
  moduleName: string;
  path: string;
  dependencies: string[];
}

export async function dependencies(path: string, moduleNames: string[]) {
  const files = await readAllFiles(path, true);
  const deps: Record<string, string[]> = {};

  for (const filename of files) {
    const file = await Deno.readTextFile(filename);
    const key = filename.replace(Deno.cwd(), '');

    for (const moduleName of moduleNames) {
      if (file.indexOf(`https://deno.land/x/${moduleName}`) === -1) {
        continue;
      }

      if (!deps[key]) {
        deps[key] = [];
      }

      deps[key].push(moduleName);
    }
  }

  const value: ModuleDependencies[] = Object.entries(deps).map((
    [path, value],
  ) => {
    const moduleName = /modules\/(\w+)\//g.exec(path);
    const modulePath = /(.+modules\/\w+)\//g.exec(path);
    if (!moduleName || !modulePath) {
      throw new Error('invariant');
    }

    return {
      moduleName: moduleName[1],
      path: modulePath[1],
      dependencies: value,
    };
  });

  return value;
}
