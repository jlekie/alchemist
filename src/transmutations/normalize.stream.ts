import { from, map, concatAll, mergeMap } from 'rxjs';

import { Transmutation, Manifest, Context } from '..';
import { Readable } from 'stream';

interface NormalizeStreamTransmutationParams {
}
class NormalizeStreamTransmutation implements Transmutation.TransmutationModule {
    public constructor(params: NormalizeStreamTransmutationParams) {
    }

    public transmute(params: Transmutation.TransmuteContext) {
        return params.observable.pipe(
            mergeMap(context => context.payload instanceof Readable
                ? from(context.payload).pipe(
                    map((payload: Readable) => context.forward(payload))
                )
                : from([ context ])
            )
        );
        // return params.observable;
        // params.observable.pipe(map(context => {
        //     if (context instanceof Readable)
        //         return from(context)
        //     else
        //         return context
        // }), concatAll()).subscribe(context => {

        // });

        // params.observable.subscribe(context => {
        //     if (context instanceof Readable) {
        //         console.log('BUFFERING STREAM')
        //         from(context).subscribe(context => params.next(context));
        //     }
        //     else {
        //         params.next(context);
        //     }
        // });
    }
}

export default ((options, params) => {
    return new NormalizeStreamTransmutation({});
}) satisfies Transmutation.TransmutationModuleFunction;
