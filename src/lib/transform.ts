import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { debug } from './utils';

import {  Context } from './context';
import { TransformOptions } from './transformManifest';

export type TransformationHandler = (context: Context, options: TransformOptions, params: TransformParams) => Context | Context[] | undefined | Promise<Context | Context[] | undefined> | (Context | Promise<Context> | undefined)[];

export interface TransformParams {
    basePath: string;
    manifestBasePath: string;
    contextBasePath?: string;
    runtimeArgs: Record<string, string>;
}

export interface ITransformation {
    readonly name: string;
    readonly includedContexts: readonly string[];
    readonly excludedContexts: readonly string[];
    readonly options: TransformOptions;

    transform(context: Context): Promise<Context[]>;
    applicableContext(name: string): boolean;
}

export class Transformation implements ITransformation {
    public readonly name: string;
    public readonly includedContexts: readonly string[];
    public readonly excludedContexts: readonly string[];
    public readonly options: TransformOptions;
    public readonly params: TransformParams;

    public readonly handler: TransformationHandler;

    public constructor(params: TransformationParams) {
        this.name = params.name;
        this.includedContexts = params.includedContexts || [];
        this.excludedContexts = params.excludedContexts || [];
        this.options = params.options || {};
        this.params = params.params;
        this.handler = params.handler;
    }

    public async transform(context: Context): Promise<Context[]> {
        debug('transform', { context });

        const result = this.handler(context, this.options, this.params);

        if (_.isArray(result))
            return Promise.all(_.compact(result));
        else {
            const resolvedResult = await result;

            if (resolvedResult)
                if (_.isArray(resolvedResult))
                    return resolvedResult;
                else
                    return [ resolvedResult ];
            else
                return [];
        }
    }

    public applicableContext(name: string) {
        if (this.includedContexts.length > 0) {
            return this.includedContexts.indexOf(name) >= 0;
        }
        if (this.excludedContexts.length > 0) {
            return this.excludedContexts.indexOf(name) < 0;
        }

        return true;
    }
}

export type TransformationParams = Pick<Transformation, 'name' | 'handler' | 'params'> & Partial<Pick<Transformation, 'options' | 'includedContexts' | 'excludedContexts'>>;