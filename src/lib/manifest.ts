import * as _ from 'lodash';
import * as ParseHelpers from '@jlekie/parse-helpers';

import { debug } from './utils';

import { RendererManifest, IRendererManifest } from './rendererManifest';
import { Context } from './context';
import { ITransformManifest, TransformManifest } from './transformManifest';

export interface IManifest {
    readonly context: (string | Context | (string | Context)[]) | undefined;
    readonly transforms: ReadonlyArray<string | ITransformManifest>;
    readonly output: string | undefined;
    readonly renderer: string | IRendererManifest | undefined;
    readonly stages: ReadonlyArray<IManifestStage>;
    readonly workflows: ReadonlyArray<IManifestWorkflow>;
}

export class Manifest implements IManifest {
    public static parse(hash: any): Manifest {
        debug('Manifest.parse', hash);

        const context = ParseHelpers.sanitize('context', (key) => {
            const value = hash[key];

            if (_.isNil(value))
                return;
            else if (_.isString(value))
                return ParseHelpers.sanitizeString(value);
            else if (_.isArray(value)) {
                return value.map(i => {
                    if (_.isString(i))
                        return ParseHelpers.sanitizeString(i);
                    else
                        return Context.parse(i);
                });
            }
            else
                return Context.parse(value);
        });
        const transforms = ParseHelpers.sanitize('transforms', (key) => {
            const items = ParseHelpers.sanitizeOptionalArray(hash[key]);
            if (items) {
                return items.map(item => {
                    if (_.isString(hash[key]))
                        return ParseHelpers.sanitizeString(item);
                    else {
                        return TransformManifest.parse(item);
                    }
                });
            }
        });
        const output = ParseHelpers.sanitize('output', (key) => ParseHelpers.sanitizeOptionalString(hash[key]));
        const renderer = ParseHelpers.sanitize('renderer', (key) => {
            const value = hash[key];

            if (_.isNil(value))
                return;
            else if (_.isString(value))
                return ParseHelpers.sanitizeString(value);
            else {
                return RendererManifest.parse(value);
            }
        });
        const stages = ParseHelpers.sanitize('stages', (key) => {
            const items = ParseHelpers.sanitizeOptionalArray(hash[key]);
            if (items)
                return items.map(item => ManifestStage.parse(item));
        });
        const workflows = ParseHelpers.sanitize('workflows', (key) => {
            const items = ParseHelpers.sanitizeOptionalArray(hash[key]);
            if (items)
                return items.map(item => ManifestWorkflow.parse(item));
        });

        return new Manifest({
            context,
            transforms,
            output,
            renderer,
            stages,
            workflows
        });
    }

    public readonly context: (string | Context | (string | Context)[]) | undefined;
    public readonly transforms: ReadonlyArray<string | ITransformManifest>;
    public readonly output: string | undefined;
    public readonly renderer: string | IRendererManifest | undefined;
    public readonly stages: ReadonlyArray<IManifestStage>;
    public readonly workflows: ReadonlyArray<IManifestWorkflow>;

    public constructor(params: ManifestParams) {
        this.context = params.context;
        this.transforms = params.transforms ? params.transforms.slice() : [];
        this.output = params.output;
        this.renderer = params.renderer;
        this.stages = params.stages || [];
        this.workflows = params.workflows || [];
    }
}

export type ManifestParams = Pick<Manifest, 'context'> & Partial<Pick<Manifest, 'transforms' | 'output' | 'renderer' | 'stages' | 'workflows'>>;

export interface IManifestStage {
    readonly name: string;
    readonly transform: string | ITransformManifest | undefined;
    readonly renderer: string | IRendererManifest | undefined;
    readonly output: string | undefined;
    readonly mergeContexts: boolean;
}

export class ManifestStage implements IManifestStage {
    public static parse(hash: any): ManifestStage {
        debug('ManifestStage.parse', hash);

        const name = ParseHelpers.sanitize('name', (key) => ParseHelpers.sanitizeString(hash[key]));
        const transform = ParseHelpers.sanitize('transform', (key) => {
            const value = hash[key];

            if (_.isNil(value))
                return;
            else if (_.isString(value))
                return ParseHelpers.sanitizeString(value);
            else {
                return TransformManifest.parse(value);
            }
        });
        const renderer = ParseHelpers.sanitize('renderer', (key) => {
            const value = hash[key];

            if (_.isNil(value))
                return;
            else if (_.isString(value))
                return ParseHelpers.sanitizeString(value);
            else {
                return RendererManifest.parse(value);
            }
        });
        const output = ParseHelpers.sanitize('output', (key) => ParseHelpers.sanitizeOptionalString(hash[key]));
        const mergeContexts = ParseHelpers.sanitize('mergeContexts', (key) => ParseHelpers.sanitizeOptionalBoolean(hash[key]));

        return new ManifestStage({
            name,
            transform,
            renderer,
            output,
            mergeContexts
        });
    }

    public readonly name: string;
    public readonly transform: string | ITransformManifest | undefined;
    public readonly renderer: string | IRendererManifest | undefined;
    public readonly output: string | undefined;
    public readonly mergeContexts: boolean;

    public constructor(params: ManifestStageParams) {
        this.name = params.name;
        this.transform = params.transform;
        this.renderer = params.renderer;
        this.output = params.output;
        this.mergeContexts = params.mergeContexts || false;
    }
}

export type ManifestStageParams = Pick<ManifestStage, 'name'> & Partial<Pick<ManifestStage, 'transform' | 'renderer' | 'output' | 'mergeContexts'>>;

export interface IManifestWorkflow {
    readonly name: string;
    readonly context: (string | Context | (string | Context)[]) | undefined;
    readonly stages: ReadonlyArray<IManifestStage>;
}

export class ManifestWorkflow implements IManifestWorkflow {
    public static parse(hash: any) {
        debug('ManifestWorkflow.parse', hash);

        const name = ParseHelpers.sanitize('name', (key) => ParseHelpers.sanitizeString(hash[key]));
        const context = ParseHelpers.sanitize('context', (key) => {
            const value = hash[key];

            if (_.isNil(value))
                return;
            else if (_.isString(value))
                return ParseHelpers.sanitizeString(value);
            else if (_.isArray(value)) {
                return value.map(i => {
                    if (_.isString(i))
                        return ParseHelpers.sanitizeString(i);
                    else
                        return Context.parse(i);
                });
            }
            else
                return Context.parse(value);
        });
        const stages = ParseHelpers.sanitize('stages', (key) => {
            const items = ParseHelpers.sanitizeOptionalArray(hash[key]);
            if (items)
                return items.map(item => ManifestStage.parse(item));
        });

        return new ManifestWorkflow({
            name,
            context,
            stages
        });
    }

    public readonly name: string;
    public readonly context: (string | Context | (string | Context)[]) | undefined;
    public readonly stages: ReadonlyArray<IManifestStage>;

    public constructor(params: ManifestWorkflowParams) {
        this.name = params.name;
        this.context = params.context;
        this.stages = params.stages || [];
    }
}

export type ManifestWorkflowParams = Pick<ManifestWorkflow, 'name'> & Partial<Pick<ManifestWorkflow, 'stages' | 'context'>>;