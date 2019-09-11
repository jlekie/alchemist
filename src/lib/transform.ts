import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { debug } from './utils';

import {  Context } from './context';
import { TransformOptions } from './transformManifest';

export type TransformationHandler = (context: Context, options: TransformOptions, params: TransformParams) => Context | Context[] | undefined | Promise<Context | Context[] | undefined> | (Context | Promise<Context> | undefined)[];

export interface TransformParams {
    basePath: string;
    contextBasePath?: string;
}

export interface ITransformation {
    readonly name: string;
    readonly options: TransformOptions;

    transform(context: Context): Promise<Context[]>;
}

export class Transformation implements ITransformation {
    public readonly name: string;
    public readonly options: TransformOptions;
    public readonly params: TransformParams;

    public readonly handler: TransformationHandler;

    public constructor(params: TransformationParams) {
        this.name = params.name;
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
}

export type TransformationParams = Pick<Transformation, 'name' | 'handler' | 'params'> & Partial<Pick<Transformation, 'options'>>;