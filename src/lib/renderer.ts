import * as ParseHelpers from '@jlekie/parse-helpers';

import { Context } from './context';

import { debug } from './utils';

export type CreateRendererHandler = (options: RendererOptions, params: RendererCreationOptions) => IRenderer | Promise<IRenderer>;

export interface RendererCreationOptions {
    basePath: string;
}

export interface RendererOptions {
    [key: string]: any;
}

export interface IRenderer {
    render(context: Context): Promise<Buffer | Buffer[]>;
}

export abstract class ARenderer implements IRenderer {
    public abstract render(context: Context): Promise<Buffer | Buffer[]>;
}