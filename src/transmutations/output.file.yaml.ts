import { FluentType as FT, FluentTypeCheckError } from '@jlekie/fluent-typebox';

import * as Path from 'path';
import * as FS from 'fs-extra';

import * as Yaml from 'js-yaml';

import { Transmutation, Manifest, Context } from '..';
import { Observable, from, mergeMap, tap, map } from 'rxjs';

interface InputTextFileTransmutationParams {
    path: InputTextFileTransmutation['path'];
}
class InputTextFileTransmutation implements Transmutation.TransmutationModule {
    public readonly path: string;

    public constructor(params: InputTextFileTransmutationParams) {
        this.path = params.path;
    }

    public transmute(params: Transmutation.TransmuteContext) {
        return params.observable.pipe(
            // tap(context => {
            //     const path = Path.resolve(this.path, `${context.metadata['outputQualifier']}.json`);

            //     return from((async () => {
            //         await FS.ensureFile(path);
            //         await FS.writeJson(path, context.payload, {
            //             spaces: 2
            //         })
            //     })());
            // }),
            mergeMap(context => {
                const path = context.metadata['alchemist.io/output/qualifier'] ? this.path.replace('**', context.metadata['alchemist.io/output/qualifier'].toString()) : this.path;

                return from((async () => {
                    await FS.ensureFile(path);
                    await FS.writeFile(path, Yaml.dump(context.payload, {
                        indent: 2
                    }));

                    return context.forward(context.payload, {
                        metadata: {
                            'alchemist.io/output.file/path': path
                        }
                    });
                })());
            })
        );
    }
}

const OptionsTypeCheck = FT.object({
    path: FT.string()
}).compile();

export default ((options, params) => {
    if (!OptionsTypeCheck.check(options))
        throw new FluentTypeCheckError('options validation failed', OptionsTypeCheck, options);

    const path = Path.resolve(Manifest.resolveTemplate(options.path, params.variables));

    return new InputTextFileTransmutation({ path });
}) satisfies Transmutation.TransmutationModuleFunction;
