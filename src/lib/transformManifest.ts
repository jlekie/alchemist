import * as _ from 'lodash';

import * as ParseHelpers from '@jlekie/parse-helpers';

import { debug } from './utils';

export interface TransformOptions {
    [key: string]: any;
}

export interface ITransformManifest {
    readonly module: string;
    readonly options: TransformOptions;
}

export class TransformManifest implements ITransformManifest {
    public static parse(hash: any) {
        debug('TransformManifest.parse', hash);

        const module = ParseHelpers.sanitize('module', (key) => ParseHelpers.sanitizeString(hash[key]));
        const options = ParseHelpers.sanitize('options', (key) => _.omit(hash, 'module'));

        return new this({
            module,
            options
        });
    }

    public readonly module: string;
    public readonly options: TransformOptions;

    public constructor(params: TransformManifestParams) {
        this.module = params.module;
        this.options = params.options || {};
    }
}

export type TransformManifestParams = Pick<TransformManifest, 'module'> & Partial<Pick<TransformManifest, 'options'>>;