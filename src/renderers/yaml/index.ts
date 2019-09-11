import * as Yaml from 'js-yaml';
import * as _ from 'lodash';

import { ARenderer, RendererOptions, Context, CreateRendererHandler } from '../..';

export class YamlRenderer extends ARenderer {
    public async render(context: Context) {
        if (_.isArray(context.payload)) {
            return Buffer.from(Yaml.safeDump(context.payload, {
                skipInvalid: true
            }));
        }
        else {
            if (context.payload.mergedContexts) {
                return Buffer.from(context.payload.mergedContexts.map((c: any) => Yaml.safeDump(c.payload, {
                    skipInvalid: true
                })).join('\n---\n\n'));
            }
            else {
                return Buffer.from(Yaml.safeDump(context.payload, {
                    skipInvalid: true
                }));
            }
        }
    }
}

export const create: CreateRendererHandler = (options, params) => {
    return new YamlRenderer();
};