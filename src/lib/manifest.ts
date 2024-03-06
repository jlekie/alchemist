import * as _ from 'lodash';

import * as Path from 'path';
import * as FS from 'fs-extra';
import * as Yaml from 'js-yaml';

import Bluebird from 'bluebird';
import { Observable, Observer, Subscriber, concatAll, filter, from, map, mergeMap, mergeScan, reduce, tap, zip } from 'rxjs';

import Handlebars from 'handlebars';

import { FluentType as FT, Type, FluentTypeBuilderBase, FluentTypeCheck, FluentTypeCheckError, Static, Value } from '@jlekie/fluent-typebox';
import { Readable, Writable } from 'stream';

import { ResolveTransmutationModuleContext, TransmuteContext } from './transmutation';
import { Context } from './context';

type ExtractTypeCheckerSchema<P> = P extends FluentTypeCheck<infer T> ? Static<T> : never;
type ExtractTypeSchema<P> = P extends FluentTypeBuilderBase<infer T> ? Static<T> : never;
type Unpacked<T> = T extends (infer U)[] ? U : T;

export const ModuleReference = FT.object({
    module: FT.string()
});
export const IncantationType = FT.recursive(IncantationType => FT.object({
    name: FT.string().optional(),
    transmutations: FT.union([
        FT.string(),
        ModuleReference
    ]).array().optional(),
    incantations: FT.union([
        FT.string(),
        ModuleReference,
        IncantationType
    ]).array().optional()
}));
export const ManifestType = FT.object({
    version: FT.string(),
    name: FT.string().optional(),
    variables: FT.record(FT.string(), FT.string()).optional(),
    transmutations: FT.union([
        FT.string(),
        ModuleReference
    ]).array().optional(),
    incantations: FT.union([
        FT.string(),
        ModuleReference,
        IncantationType
    ]).array().optional()
});
const ManifestTypeChecker = ManifestType.compile();

export const TransmutationModuleType = FT.object({
    default: FT.object({
        default: FT.function([ FT.unknown(), FT.unknown() ], FT.unknown().promised())
    })
}).compile();
export const LoadedTransmutationType = FT.object({
    transmute: FT.function([ FT.unknown() ], FT.unknown()).cast<(params: TransmuteContext) => Observable<Context>>()
}).compile();

export const IncantationModuleType = FT.object({
    default: FT.function([ FT.unknown() ], FT.unknown().promised())
}).compile();
// export const LoadedIncantationType = FT.object({
//     transmute: FT.function([], FT.unknown().promised())
// }).compile();

// const ResolveIncantationTypeChecker = FT.function([
//     options: FT.unknown(),

// ]);

// const Tmp = FT.unsafe<string>().compile()
// const tmp = {};
// if (Tmp.check(tmp)) {
//     tmp
// }

export interface ManifestParams {
    name: Manifest['name'];
    variables?: Manifest['variables'] | undefined;
    transmutations?: Manifest['transmutations'] | undefined;
    incantations?: Manifest['incantations'] | undefined;
}
export class Manifest {
    public static fromSchema(schema: ExtractTypeCheckerSchema<typeof ManifestTypeChecker>): Manifest {
        return new Manifest({
            name: schema.name,
            variables: schema.variables,
            transmutations: schema.transmutations?.map(t => typeof t === 'string'
                ? new ReferencedTransmutation({ module: t })
                : ReferencedTransmutation.fromSchema(t)
            ),
            incantations: schema.incantations?.map(t => typeof t === 'string'
                ? new ReferencedIncantation({ module: t })
                : 'module' in t
                    ? ReferencedIncantation.fromSchema(t)
                    : InlineIncantation.fromSchema(t)
            )
        });
    }

    public name: string | undefined;
    public variables: Record<string, string>;
    public transmutations: ReferencedTransmutation[];
    public incantations: (ReferencedIncantation | InlineIncantation)[];

    public constructor(params: ManifestParams) {
        this.name = params.name;
        this.variables = params.variables ?? {};
        this.transmutations = params.transmutations ?? [];
        this.incantations = params.incantations ?? [];
    }

    public transmute(observable?: Observable<Context>, localVariables?: Record<string, string>) {
        const variables: Record<string, string> = {
            cwd: process.cwd()
        };
        _.transform(this.variables, (result, value, key) => {
            result[key] = _.template(value)(result);
        }, variables);
        localVariables && _.transform(localVariables, (result, value, key) => {
            result[key] = _.template(value)(result);
        }, variables);

        return from(this.transmutations).pipe(
            reduce((o, t) => {
                return t.transmute(variables, o);
            }, (observable ?? from<Context[]>([ new Context({ payload: undefined }) ]))),
            concatAll()
        );

        // return (observable ?? from<unknown[]>([ undefined ])).pipe(observable => {
        //     return reduce((observable, t) => , observable)

        //     return from(this.transmutations).pipe(
        //         mergeMap(transmutation => transmutation.transmute(variables, observable))
        //     );
        // });

        // return (observable ?? from<unknown[]>([ undefined ])).pipe(
        //     map(context => [ context, this.transmutations ] as const),
        //     mergeMap(([ context, transmutations ]) => from(transmutations).pipe(observable => {
        //         return from(transmutations).pipe(
        //             reduce((observable, transmutation) => transmutation.transmute(variables, context), observable as Observable<unknown>)
        //         );
        //     }))
        //     // mergeMap(([ context, transmutations ]) => from(transmutations).pipe(
        //     //     reduce(transmutation => transmutation.transmute(variables, context), )
        //     // ))
        // );
        // return from(this.transmutations).pipe(
        //     mergeMap(transmutation => transmutation.transmute(variables))
        // );

        // const transmuteContext = new TransmuteContext({ variables });

        // const observables = await Bluebird.map(this.transmutations, t => t.transmute(variables));
        // const firstO = observables[0];
        // const secondO = observables[1];
        // if (firstO && secondO) {
        //     firstO.pipe(map(context => secondO.subscribe()));
        // }

        // const transmutations = this.transmutations.slice();
        // let transmutation = transmutations.shift();
        // while (transmutation !== undefined) {
        //     transmutation.transmute()
        // }

        // observable = observable ?? from<unknown[]>([ undefined ]);

        // const tmp = from(this.transmutations).pipe(observable => {
        //     return observable.pipe(map(transmutation => {
        //         return transmutation.transmute(variables, observable);
        //     }));
        // }, concatAll());
        // tmp.pipe(observable => observable.);

        // const transmutedObservable = await Bluebird.reduce(this.transmutations, async (observable, transmutation) => {
        //     return await transmutation.transmute(variables, observable);
        //     // if (observable) {
        //     //     observable.subscribe(context => {
        //     //         transmutation.transmute(variables, context);
        //     //     });
        //     // }
        //     // else {
        //     //     observable = await transmutation.transmute(variables, observable);
        //     // }            

        //     // return observable;
        //     // observable.subscribe(context => {

        //     // });
        // }, observable ?? from<unknown[]>([ undefined ]));

        // transmutedObservable.subscribe(context => {
        //     console.log('FINAL', context)
        // });

        // console.log('TRANSMUTE.end', this.name);

        // return transmutedObservable;

        // if (this.transmutations.length > 0) {
        //     let observable = await this.transmutations[0].transmute(variables);

        //     for (let a = 1; a < this.transmutations.length; a++) {

        //     }
        // }

        // let observable: Observable<unknown> | undefined;
        // for (const transmutation of this.transmutations) {
        //     if (observable) {
        //         observable.subscribe(context => {
        //             transmutation.transmute(variables, context);
        //         });
        //     }
        //     else {
        //         observable = await transmutation.transmute(variables, observable);
        //     }
        // }

        // let observable: Observable<unknown>;
        // for (let a = 0; a < this.transmutations.length; a++) {
        //     observable = new Observable(subscriber => {
        //         const transmuteContext = new TransmuteContext({
        //             variables,
        //             observable,
        //             subscriber
        //         });

        //         this.transmutations[a]?.transmute(transmuteContext).then(() => {
        //         }).catch(err => {
        //             console.log(err);
        //         });
        //     });

        //     // observable.subscribe(context => {
        //     //     console.log(context);
        //     // });
        // }

        // const rawContext = JSON.stringify(context)
        // console.log(context)
        // console.log(context && JSON.parse(context))

        // await Bluebird.map(this.incantations, async incantation => await incantation.transmute(transmuteContext));
    }
}

export interface ReferencedTransmutationParams {
    module: ReferencedTransmutation['module'];
    options?: ReferencedTransmutation['options'];
}
export class ReferencedTransmutation {
    public static fromSchema(schema: ExtractTypeSchema<typeof ModuleReference>): ReferencedTransmutation {
        return new ReferencedTransmutation({
            module: schema.module,
            options: _.omit(schema, 'module')
        });
    }

    public module: string;
    public options: Record<string, unknown>;

    public constructor(params: ReferencedTransmutationParams) {
        this.module = params.module;
        this.options = params.options ?? {};
    }

    public transmute(variables: Record<string, string>, observable: Observable<Context>) {
        const resolvedModulePath = require.resolve(this.module);

        return from(import(`file://${resolvedModulePath}`)).pipe(
            // tap(context => console.log(context)),
            filter(TransmutationModuleType.validate.bind(TransmutationModuleType)),
            mergeMap(loadedModule => Promise.resolve(loadedModule.default.default(this.options, new ResolveTransmutationModuleContext({ variables })))),
            filter(LoadedTransmutationType.validate.bind(LoadedTransmutationType)),
            mergeMap(loadedTransmutation => loadedTransmutation.transmute(new TransmuteContext({
                observable,
                variables
            })))
        );

        // return from((async () => {
        //     const loadedModule = await import(resolvedModulePath) as unknown;
        //     if (!TransmutationModuleType.check(loadedModule))
        //         throw new FluentTypeCheckError('module validation failed', TransmutationModuleType, loadedModule);

        //     const transmutation = await loadedModule.default(this.options, new ResolveTransmutationModuleContext({ variables }));
        //     if (!LoadedTransmutationType.check(transmutation))
        //         throw new FluentTypeCheckError('transmutation validation failed', LoadedTransmutationType, transmutation);

        //     return transmutation;
        // })()).pipe(map(transmutation => {
        //     return new Observable(subscriber => transmutation.transmute(new TransmuteContext({
        //         variables,
        //         observable,
        //         subscriber
        //     })));
        // }), concatAll())

        // const loadedModule = await import(resolvedModulePath) as unknown;
        // if (!TransmutationModuleType.check(loadedModule))
        //     throw new FluentTypeCheckError('module validation failed', TransmutationModuleType, loadedModule);

        // const transmutation = await loadedModule.default(this.options, new ResolveTransmutationModuleContext({ variables }));
        // if (!LoadedTransmutationType.check(transmutation))
        //     throw new FluentTypeCheckError('transmutation validation failed', LoadedTransmutationType, transmutation);

        // return observable.pipe(observable => {
        //     return new Observable(subscriber => transmutation.transmute(new TransmuteContext({
        //         variables,
        //         observable,
        //         subscriber
        //     })));
        // });


        // if (observer) {
        //     observer.subscribe(context => {

        //     });
        // }
        // else {
        //     return new Observable(subscriber => {
        //         transmutation.transmute(new TransmuteContext({
        //             variables,
        //             subscriber
        //         }));
        //     });
        // }

        // const observe = new Observable(subscriber => {
        //     transmutation.transmute(new TransmuteContext({
        //         variables,
        //         subscriber
        //     }));
        //     // Promise.resolve(transmutation.transmute(transmuteContext)).then(() => {
        //     //     subscriber.complete();
        //     //     console.log(this.module, 'COMPLETE')
        //     // }).catch(err => {
        //     //     console.log(err);
        //     // });
        // });

        // return observable.pipe(map(context => {
        //     // console.log(context)
        //     return new Observable(subscriber => transmutation.transmute(new TransmuteContext({
        //         variables,
        //         subscriber
        //     })));
        // }), concatAll());
    }
}

export interface ReferencedIncantationParams {
    module: ReferencedIncantation['module'];
    options?: ReferencedIncantation['options'];
}
export class ReferencedIncantation {
    public static fromSchema(schema: ExtractTypeSchema<typeof ModuleReference>): ReferencedIncantation {
        return new ReferencedIncantation({
            module: schema.module,
            options: _.omit(schema, 'module')
        });
    }

    public module: string;
    public options: Record<string, unknown>;

    public constructor(params: ReferencedIncantationParams) {
        this.module = params.module;
        this.options = params.options ?? {};
    }

    public async transmute(variables: Record<string, string>) {
        const resolvedModulePath = require.resolve(this.module);

        const loadedModule = await import(resolvedModulePath) as unknown;
        if (!TransmutationModuleType.check(loadedModule))
            throw new FluentTypeCheckError('module validation failed', TransmutationModuleType, loadedModule);

        const hash = await loadedModule.default.default(this.options, new ResolveTransmutationModuleContext({ variables }));
        if (!ManifestTypeChecker.check(hash))
            throw new FluentTypeCheckError('incantation manifest validation failed', ManifestTypeChecker, hash);

        const manifest = Manifest.fromSchema(hash);
        return manifest.transmute();

        // for (const transmutation of manifest.transmutations) {
        //     await transmutation.transmute(params);
        // }

        // await Bluebird.map(manifest.incantations, async incantation => await incantation.transmute(params));
    }
}

export interface InlineIncantationParams {
    name: InlineIncantation['name'];
    transmutations?: InlineIncantation['transmutations'] | undefined;
    incantations?: InlineIncantation['incantations'] | undefined;
}
export class InlineIncantation {
    public static fromSchema(schema: ExtractTypeSchema<typeof IncantationType>): InlineIncantation {
        return new InlineIncantation({
            name: schema.name,
            transmutations: schema.transmutations?.map(t => typeof t === 'string'
                ? new ReferencedTransmutation({ module: t })
                : ReferencedTransmutation.fromSchema(t)
            ),
            incantations: schema.incantations?.map(t => typeof t === 'string'
                ? new ReferencedIncantation({ module: t })
                : 'module' in t
                    ? ReferencedIncantation.fromSchema(t)
                    : InlineIncantation.fromSchema(t)
            )
        });
    }

    public name: string | undefined;
    public transmutations: ReferencedTransmutation[];
    public incantations: (ReferencedIncantation | InlineIncantation)[];

    public constructor(params: InlineIncantationParams) {
        this.name = params.name;
        this.transmutations = params.transmutations ?? [];
        this.incantations = params.incantations ?? [];
    }

    public async transmute(variables: Record<string, string>) {
        // for (const transmutation of this.transmutations)
        //     await transmutation.transmute(variables);

        await Bluebird.map(this.incantations, async incantation => await incantation.transmute(variables));
    }
}

export async function loadManifest(path: string) {
    const content = await FS.readFile(path, 'utf8');
    const hash = Yaml.load(content);

    if (!ManifestTypeChecker.check(hash))
        throw new FluentTypeCheckError('manifest validation failed', ManifestTypeChecker, hash);

    return Manifest.fromSchema(hash);
}
export async function loadManifests(path: string) {
    const content = await FS.readFile(path, 'utf8');
    const hashes = Yaml.loadAll(content);

    return hashes.map(hash => {
        if (!ManifestTypeChecker.check(hash))
            throw new FluentTypeCheckError('manifest validation failed', ManifestTypeChecker, hash);

        return Manifest.fromSchema(hash);
    });
}

export function resolveTemplate(template: string, variables?: Record<string, string>) {
    return _.template(template)(variables);
}
