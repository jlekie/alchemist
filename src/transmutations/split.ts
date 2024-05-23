import { FluentType as FT, FluentTypeCheckError } from '@jlekie/fluent-typebox';

import * as Path from 'path';
import * as FS from 'fs-extra';
import * as Yaml from 'js-yaml';

import { Transmutation, Manifest, Context } from '..';
import * as Rx from 'rxjs';

interface SplitTransmutationParams {
    transmutations?: SplitTransmutation['transmutations'] | undefined;
}
class SplitTransmutation implements Transmutation.TransmutationModule {
    public readonly transmutations: Manifest.ReferencedTransmutation[];

    public constructor(params: SplitTransmutationParams) {
        this.transmutations = params.transmutations ?? [];
    }

    public transmute(params: Transmutation.TransmuteContext) {
        return params.observable.pipe(
            Rx.concatMap(context => Rx.from(this.transmutations).pipe(
                Rx.map(t => t.transmute(params.variables, Rx.of(context)))
            )),
            Rx.concatAll()
        )

        // params.observable.subscribe(o => {
        //     console.log('CONTEXT', o)
        // })

        // return Rx.from(this.transmutations).pipe(
        //     Rx.reduce((o, t) => {
        //         return t.transmute(params.variables, o);
        //     }, (params.observable.pipe(Rx.map(o => o.forward(o.payload))) ?? Rx.from<Context.Context[]>([ new Context.Context({ payload: undefined }) ]))),
        //     Rx.concatAll()
        // );
    }
}

const OptionsTypeCheck = FT.object({
    transmutations: FT.union([
        FT.string(),
        Manifest.ModuleReference
    ]).array().optional()
}).compile();

export default ((options, params) => {
    if (!OptionsTypeCheck.check(options))
        throw new FluentTypeCheckError('options validation failed', OptionsTypeCheck, options);

    const transmutations = options.transmutations?.map(t => typeof t === 'string'
        ? new Manifest.ReferencedTransmutation({ module: t })
        : Manifest.ReferencedTransmutation.fromSchema(t)
    );

    return new SplitTransmutation({ transmutations });
}) satisfies Transmutation.TransmutationModuleFunction;
