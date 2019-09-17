export * from './lib/context';
export * from './lib/transform';
export * from './lib/manifest';
export * from './lib/renderer';
export * from './lib/transformManifest';
export * from './lib/rendererManifest';

import { resolveModuleIdentifier } from './lib/utils';

import { debug } from './lib/utils';
import { DataAdapter, IDataAdapter } from './lib/dataAdapter';

export {
    resolveModuleIdentifier
};

export function createDataAdapter(): IDataAdapter {
    debug('createDataAdapter');

    return new DataAdapter();
}