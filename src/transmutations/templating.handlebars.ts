import { FluentType as FT, FluentTypeCheckError } from '@jlekie/fluent-typebox';
import { from, map, concatAll } from 'rxjs';

import * as Path from 'path';
import * as FS from 'fs-extra';
import * as Yaml from 'js-yaml';
import * as FG from 'fast-glob';

import Handlebars, { TemplateDelegate } from 'handlebars';
import HandlebarsHelpers from 'handlebars-helpers';

import { Transmutation, Manifest, Context } from '..';
import { ConstructorParameters, ExtractTypeSchema } from '../lib/misc';

HandlebarsHelpers();

interface HandlebarsTransmutationParams {
    template: TemplateDelegate;
}
class HandlebarsTransmutation implements Transmutation.TransmutationModule {
    public template: TemplateDelegate;

    public constructor(params: HandlebarsTransmutationParams) {
        this.template = params.template;
    }

    public transmute(params: Transmutation.TransmuteContext) {
        return params.observable.pipe(
            map(context => context.forward(this.template(context.payload)))
        );
    }
}

export class PartialsManifest {
    public pattern: string;
    public basePath: string | undefined;

    public constructor(params: ConstructorParameters<PartialsManifest, 'pattern', 'basePath'>) {
        this.pattern = params.pattern;
        this.basePath = params.basePath;
    }
}
export const PartialsManifestType = FT.object({
    pattern: FT.string(),
    basePath: FT.string().optional()
});
export const PartialsManifestTypeChecker = PartialsManifestType.compile();
export function parsePartialsManifestType(value: ExtractTypeSchema<typeof PartialsManifestTypeChecker>) {
    return new PartialsManifest({
        ...value
    });
}
export function parsePartialsManifest(value: unknown) {
    if (!PartialsManifestTypeChecker.check(value))
        throw new FluentTypeCheckError('partials manifest validation failed', PartialsManifestTypeChecker, value);

    return parsePartialsManifestType(value);
}

export class TemplateManifest {
    public template: string;
    public partials: PartialsManifest[];

    public constructor(params: ConstructorParameters<TemplateManifest, 'template', 'partials'>) {
        this.template = params.template;
        this.partials = params.partials ?? [];
    }
}
export const TemplateManifestTypeChecker = FT.object({
    template: FT.string(),
    partials: PartialsManifestType.array().optional(),
}).compile();
export function parseTemplateManifestType(value: ExtractTypeSchema<typeof TemplateManifestTypeChecker>) {
    return new TemplateManifest({
        ...value,
        partials: value.partials?.map(p => parsePartialsManifest(p))
    });
}
export function parseTemplateManifest(value: unknown) {
    if (!TemplateManifestTypeChecker.check(value))
        throw new FluentTypeCheckError('template manifest validation failed', TemplateManifestTypeChecker, value);

    return parseTemplateManifestType(value);
}

// const PartialsTypeCheck = FT.union([
//     FT.string(),
//     FT.object({
//         module: FT.string(),
//         pattern: FT.string()
//     })
// ]);
const OptionsTypeCheck = FT.union([
    FT.object({
        template: FT.string(),
        partialsPaths: FT.string().array().optional()
    }),
    FT.object({
        templatePath: FT.string(),
        partialsPaths: FT.string().array().optional()
    })
]).compile();

export default (async (options, params) => {
    if (!OptionsTypeCheck.check(options))
        throw new FluentTypeCheckError('options validation failed', OptionsTypeCheck, options);

    Handlebars.registerHelper('json', function(context) {
        return JSON.stringify(context);
    });

    for (const partialsPath of options.partialsPaths ?? []) {
        const targetPath = require.resolve(params.resolveTemplate(partialsPath));
        const targetExt = Path.extname(targetPath);

        switch (targetExt.toLowerCase()) {
            case '.json':
            case '.yml':
            case '.yaml': {
                const rawManifest = await FS.readFile(targetPath, 'utf8').then(content => Yaml.load(content));
                const manifest = parsePartialsManifest(rawManifest);

                const cwd = manifest.basePath ? Path.resolve(Path.dirname(targetPath), manifest.basePath) : Path.dirname(targetPath);

                for await (const path of FG.stream(manifest.pattern, { cwd, absolute: true })) {
                    if (typeof path !== 'string')
                        throw new Error();

                    const partialName = Path.resolve(path).replace(cwd, '').substring(1).replace(Path.extname(path), '').replace(/\\/g, '/');
                    const partialTemplate = await FS.readFile(path, 'utf8');

                    Handlebars.registerPartial(partialName, partialTemplate);
                }
            } break;
            default:
                throw new Error(`unknown template extension ${targetExt}`);
        }
    }

    const template = await (async () => {
        if ('template' in options) {
            return Handlebars.compile(options.template);
        }
        else {
            const targetPath = require.resolve(params.resolveTemplate(options.templatePath));
            const targetExt = Path.extname(targetPath);

            switch (targetExt.toLowerCase()) {
                case '.hbs': {
                    const template = await FS.readFile(targetPath, 'utf8');
                    return Handlebars.compile(template);
                }
                case '.json':
                case '.yml':
                case '.yaml': {
                    const rawManifest = await FS.readFile(targetPath, 'utf8').then(content => Yaml.load(content));
                    const manifest = parseTemplateManifest(rawManifest);

                    const templatePath = Path.resolve(Path.dirname(targetPath), manifest.template);
                    const template = await FS.readFile(templatePath, 'utf8');

                    for (const partialManifest of manifest.partials) {
                        const cwd = partialManifest.basePath ? Path.resolve(Path.dirname(targetPath), partialManifest.basePath) : Path.dirname(targetPath);

                        for await (const path of FG.stream(partialManifest.pattern, { cwd, absolute: true })) {
                            if (typeof path !== 'string')
                                throw new Error();

                            const partialName = Path.resolve(path).replace(cwd, '').substring(1).replace(Path.extname(path), '').replace(/\\/g, '/');
                            const partialTemplate = await FS.readFile(path, 'utf8');

                            Handlebars.registerPartial(partialName, partialTemplate);
                        }
                    }

                    return Handlebars.compile(template, { noEscape: true });
                }
                default:
                    throw new Error(`unknown template extension ${targetExt}`);
            }
        }
    })();

    // const template = Handlebars.compile('{{{json .}}}');

    return new HandlebarsTransmutation({
        template
    });
}) satisfies Transmutation.TransmutationModuleFunction;
