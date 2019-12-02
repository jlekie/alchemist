import { ARenderer, RendererOptions, Context, CreateRendererHandler } from '..';

export class JsonRenderer extends ARenderer {
    public async render(context: Context) {
        return Buffer.from(JSON.stringify(context.payload, undefined, 4));
    }
}

export const create: CreateRendererHandler = (options, params) => {
    return new JsonRenderer();
};