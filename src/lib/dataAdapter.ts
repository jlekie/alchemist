import * as _ from 'lodash';

import * as Path from 'path';
import * as FS from 'fs-extra';
import * as Yaml from 'js-yaml';

import * as ParseHelpers from '@jlekie/parse-helpers';

import { Context } from './context';
import { ITransformation, Transformation, TransformationHandler, TransformParams } from './transform';
import { IManifest, Manifest } from './manifest';
import { IRenderer, ARenderer, RendererCreationOptions, RendererOptions } from './renderer';
import { IRendererManifest, RendererManifest } from './rendererManifest';

import { debug, resolveModuleIdentifier } from './utils';
import { TransformOptions } from './transformManifest';

export interface IDataAdapter {
    loadContext(path: string): Promise<Context[]>;
    loadTransform(path: string, options: TransformOptions, params: TransformParams, includedContexts?: string[], excludedContexts?: string[]): Promise<ITransformation>;
    loadManifest(path: string): Promise<IManifest>;
    loadRendererManifest(path: string): Promise<IRendererManifest>;
    loadRenderer(path: string, options: RendererOptions, params: RendererCreationOptions): Promise<IRenderer>;
}

export class DataAdapter implements IDataAdapter {
    public async loadContext(path: string) {
        debug('loadContext', { path });

        const qualifier = Path.basename(path).replace(Path.extname(path), '');
        const hashes = await FS.readFile(path, 'utf8').then(content => Yaml.safeLoadAll(content));

        return hashes.map(hash => Context.parse(hash, qualifier));
    }

    public async loadTransform(path: string, options: TransformOptions, params: TransformParams, includedContexts?: string[], excludedContexts?: string[]) {
        debug('loadTransform', { path });

        const transformModule = await import(path);
        const baseName = transformModule.name || Path.basename(path, Path.extname(path));

        return new Transformation({
            name: baseName,
            handler: transformModule.handler,
            params,
            options,
            includedContexts,
            excludedContexts
        });
    }

    public async loadManifest(path: string) {
        debug('loadManifest', { path });

        const hash = await FS.readFile(path, 'utf8').then(content => Yaml.safeLoad(content));

        return Manifest.parse(hash);
    }

    public async loadRendererManifest(path: string) {
        debug('loadRendererManifest', { path });

        const hash = await FS.readFile(path, 'utf8').then(content => Yaml.safeLoad(content));

        return RendererManifest.parse(hash);
    }

    public async loadRenderer(path: string, options: RendererOptions, params: RendererCreationOptions) {
        debug('loadRenderer', { path });

        const rendererModule = await import(path);

        return rendererModule.create(options, params);

        // const hash = await FS.readFile(path, 'utf8').then(content => Yaml.safeLoad(content));

        // const engine = ParseHelpers.sanitize('engine', (key) => ParseHelpers.sanitizeString(hash[key]));
        // const engineModuleIdentifier = await resolveModuleIdentifier(engine, path);
        // const engineModule = await import(engineModuleIdentifier);

        // const options = _.omit(hash, 'engine');

        // return new Renderer(options, engineModule.handler);
    }
}