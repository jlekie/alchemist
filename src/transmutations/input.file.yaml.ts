import { FluentType as FT, FluentTypeCheckError } from '@jlekie/fluent-typebox';

import * as Path from 'path';
import * as FS from 'fs-extra';
import * as Yaml from 'js-yaml';

import { Transmutation, Manifest, Context } from '..';
import * as Rx from 'rxjs';

interface InputYamlFileTransmutationParams {
    path: InputYamlFileTransmutation['path'];
}
class InputYamlFileTransmutation implements Transmutation.TransmutationModule {
    public readonly path: string;

    public constructor(params: InputYamlFileTransmutationParams) {
        this.path = params.path;
    }

    public transmute(params: Transmutation.TransmuteContext) {
        return Rx.from(FS.readFile(this.path, 'utf8')).pipe(
            Rx.map(content => Yaml.load(content)),
            Rx.map(payload => new Context.Context({
                payload,
                metadata: {
                    'alchemist.io/input.file/path': this.path
                }
            }))
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

    return new InputYamlFileTransmutation({ path });
}) satisfies Transmutation.TransmutationModuleFunction;
