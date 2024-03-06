import { FluentType as FT, FluentTypeCheckError } from '@jlekie/fluent-typebox';

import * as Path from 'path';
import * as FS from 'fs-extra';

import { Transmutation, Manifest, Context } from '..';
import { Observable, from } from 'rxjs';

interface InputTextFileTransmutationParams {
    path: InputTextFileTransmutation['path'];
}
class InputTextFileTransmutation implements Transmutation.TransmutationModule {
    public readonly path: string;

    public constructor(params: InputTextFileTransmutationParams) {
        this.path = params.path;
    }

    public transmute(params: Transmutation.TransmuteContext) {
        const readStream = FS.createReadStream(this.path, 'utf8');

        return from([
            new Context.Context({
                payload: readStream,
                // labels: {
                //     'alchemist.io/content-type': [ 'stream' ]
                // },
                metadata: {
                    'alchemist.io/input.file/path': this.path
                }
            })
        ]);
        // const readStream = FS.createReadStream(this.path, 'utf8');
        // params.registerContextStream(readStream);
        // const content = await FS.readFile(this.path, 'utf8');

        // return content;
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
