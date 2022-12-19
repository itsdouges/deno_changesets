const topLevelModuleNames = /(main|index|mod)\.(js|ts)x?$/;

export async function repositoryType(
  dirIterable: AsyncIterable<Deno.DirEntry>,
): Promise<'single-module' | 'multi-module'> {
  const stats = {
    hasTopLevelModule: false,
    hasModulesFolder: false,
  };

  for await (const dirEntry of dirIterable) {
    if (dirEntry.isFile && topLevelModuleNames.exec(dirEntry.name)) {
      stats.hasTopLevelModule = true;
    }

    if (dirEntry.isDirectory && dirEntry.name === 'modules') {
      stats.hasModulesFolder = true;
    }
  }

  if (stats.hasModulesFolder && stats.hasTopLevelModule) {
    throw new Error(
      'invariant: repository should have either a top level module or nested ones inside a modules folder, but not both.',
    );
  }

  if (stats.hasTopLevelModule) {
    return 'single-module';
  }

  if (stats.hasModulesFolder) {
    return 'multi-module';
  }

  throw new Error('invariant: could ascertain repository type');
}
