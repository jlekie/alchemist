import * as Debug from 'debug';

import * as FS from 'fs-extra';
import * as Path from 'path';

import { createRequire } from 'module';

export const debug = Debug('@jlekie/alchemist');

export async function resolveModuleIdentifier(identifier: string, basePath?: string) {
    debug('resolveModuleIdentifier', { identifier, basePath });

    const resolvedPath = createRequire(require.resolve(identifier, basePath ? {
        paths: [ basePath ]
    } : undefined));
    console.log(resolvedPath)

    return resolvedPath(identifier);

    // const identifierPath = basePath ? Path.resolve(basePath, identifier) : Path.resolve(identifier);

    // if (await FS.pathExists(identifierPath))
    //     return identifierPath;
    // else
    //     return identifier;
}
