import * as _ from 'lodash';

import * as ParseHelpers from '@jlekie/parse-helpers';

import { debug } from './utils';

export interface TransformOptions {
    [key: string]: any;
}

export interface ITransformManifest {
    readonly module: string;
    readonly options: TransformOptions;
    readonly includedContexts: readonly string[];
    readonly excludedContexts: readonly string[];
}

export class TransformManifest implements ITransformManifest {
    public static parse(hash: any) {
        debug('TransformManifest.parse', hash);

        const module = ParseHelpers.sanitize('module', (key) => ParseHelpers.sanitizeString(hash[key]));
        const includedContexts = ParseHelpers.sanitize('includedContexts', (key) => {
            const items = ParseHelpers.sanitizeOptionalArray(hash[key]);
            if (items)
                return items.map(i => ParseHelpers.sanitizeString(i));
        });
        const excludedContexts = ParseHelpers.sanitize('excludedContexts', (key) => {
            const items = ParseHelpers.sanitizeOptionalArray(hash[key]);
            if (items)
                return items.map(i => ParseHelpers.sanitizeString(i));
        });
        const options = ParseHelpers.sanitize('options', (key) => _.omit(hash, 'module', 'includedContexts', 'excludedContexts'));

        return new this({
            module,
            includedContexts,
            excludedContexts,
            options
        });
    }

    public readonly module: string;
    public readonly options: TransformOptions;
    public readonly includedContexts: readonly string[];
    public readonly excludedContexts: readonly string[];

    public constructor(params: TransformManifestParams) {
        this.module = params.module;
        this.options = params.options || {};
        this.includedContexts = params.includedContexts || [];
        this.excludedContexts = params.excludedContexts || [];
    }
}

export type TransformManifestParams = Pick<TransformManifest, 'module'> & Partial<Pick<TransformManifest, 'options' | 'includedContexts' | 'excludedContexts'>>;