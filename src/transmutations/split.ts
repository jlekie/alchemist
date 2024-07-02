import { FluentType as FT, FluentTypeCheckError } from '@jlekie/fluent-typebox';

import * as Path from 'path';
import * as FS from 'fs-extra';
import * as Yaml from 'js-yaml';

import { Transmutation, Manifest, Context } from '..';
import * as Rx from 'rxjs';
import { reduce } from 'bluebird';

interface SplitTransmutationParams {
    transmutations?: SplitTransmutation['transmutations'] | undefined;
}
class SplitTransmutation implements Transmutation.TransmutationModule {
    public readonly transmutations: Manifest.ReferencedTransmutation[][];

    public constructor(params: SplitTransmutationParams) {
        this.transmutations = params.transmutations ?? [];
    }

    public transmute(params: Transmutation.TransmuteContext) {
        return Rx.from(this.transmutations).pipe(
            Rx.concatMap(transmutations => {
                const observable = params.observable.pipe(
                    Rx.map(c => c.forward(c.payload))
                );

                const tmp = Rx.from(transmutations).pipe(
                    Rx.reduce((o, t) => {
                        return t.transmute(params.variables, o);
                    }, observable),
                    Rx.concatAll()
                );

                return tmp;
            })
        );
    }
}

const OptionsTypeCheck = FT.object({
    transmutations: FT.union([
        FT.union([
            FT.string(),
            Manifest.ModuleReference
        ]),
        FT.union([
            FT.string(),
            Manifest.ModuleReference
        ]).array()
    ]).array()
}).compile();

export default ((options, params) => {
    if (!OptionsTypeCheck.check(options))
        throw new FluentTypeCheckError('options validation failed', OptionsTypeCheck, options);

    const transmutations = options.transmutations.map(t => Array.isArray(t) ? t : [ t ])
        .map(t => t.map(t => typeof t === 'string'
            ? new Manifest.ReferencedTransmutation({ module: t })
            : Manifest.ReferencedTransmutation.fromSchema(t)
        )
    );

    // const transmutations = options.transmutations?.map(t => typeof t === 'string'
    //     ? new Manifest.ReferencedTransmutation({ module: t })
    //     : Manifest.ReferencedTransmutation.fromSchema(t)
    // );

    return new SplitTransmutation({ transmutations });
}) satisfies Transmutation.TransmutationModuleFunction;
