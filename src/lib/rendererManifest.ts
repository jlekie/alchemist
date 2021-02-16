import * as _ from 'lodash';

import * as ParseHelpers from '@jlekie/parse-helpers';

import { debug } from './utils';
import { RendererOptions } from './renderer';

// export interface RendererOptions {
//     [key: string]: any;
// }

export interface IRendererManifest {
    readonly engine: string;
    // readonly output: string | undefined;
    readonly options: RendererOptions;
}

export class RendererManifest implements IRendererManifest {
    public static parse(hash: any): RendererManifest {
        debug('RendererManifest.parse', hash);

        const engine = ParseHelpers.sanitize('engine', (key) => ParseHelpers.sanitizeString(hash[key]));
        const options = ParseHelpers.sanitize('options', (key) => _.omit(hash, 'engine'));

        return new RendererManifest({
            engine,
            options
        });
    }

    public readonly engine: string;
    public readonly options: RendererOptions;

    public constructor(params: RendererManifestParams) {
        this.engine = params.engine;
        this.options = params.options || {};
    }
}

export type RendererManifestParams = Pick<RendererManifest, 'engine'> & Partial<Pick<RendererManifest, 'options'>>;