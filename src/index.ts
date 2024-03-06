import * as Util from 'util';
import Bluebird from 'bluebird';
import { Observable, concatAll, from, map, mergeMap, mergeAll } from 'rxjs';

import * as Manifest from './lib/manifest';

export async function transmute(path: string) {
    console.log('Transmuting...');

    const manifests = await Manifest.loadManifests(path);
    // console.log(Util.inspect(manifests, undefined, 10, true));

    from(manifests).pipe(
        mergeMap(manifest => manifest.transmute())
    ).subscribe(context => {
        // console.log('FINAL', Util.inspect(context, {
        //     depth: 10,
        //     colors: true,
        //     maxArrayLength: 1000
        // }));
    });

    // new Observable<unknown>(subscriber => {
    //     from(manifests).pipe(map(manifest => {
    //         manifest.transmute(subscriber);
    //     }));
    // });
    // observable.subscribe(context => {
    //     console.log('FINAL', context);
    // });

    // from(await Bluebird.map(manifests, async manifest => await manifest.transmute().then(observable => {
    //     observable.subscribe(context => {
    //         console.log('FINAL', context);
    //     })
    // })));
}

export * as Manifest from './lib/manifest';
export * as Transmutation from './lib/transmutation';
export * as Context from './lib/context';
export * as Misc from './lib/misc';

export * as Typescript from './lib/langs/typescript';
