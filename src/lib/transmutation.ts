import * as _ from 'lodash';
import { Observable, Observer, Subscriber } from 'rxjs';
import { Readable, Writable } from 'stream';

import { Context } from './context';

// import Bluebird from 'bluebird';

// import { FluentType as FT, FluentTypeBuilderBase, FluentTypeCheck, FluentTypeCheckError, Static } from '@jlekie/fluent-typebox';

// import { TransmuteContext } from './manifest';

export interface IncantationModule {
}

// export interface TransmuteContext {
//     variables: Record<string, string>;
//     resolveTemplate: (template: string) => string;
// }
export interface TransmuteContextParams {
    variables?: TransmuteContext['variables'];
    observable: TransmuteContext['observable'];
    // subscriber: TransmuteContext['subscriber'];
}
export class TransmuteContext {
    public readonly variables: Record<string, string>;
    public readonly observable: Observable<Context>;

    // public readonly subscriber: Subscriber<unknown>;

    public constructor(params: TransmuteContextParams) {
        this.variables = params.variables ?? {};
        this.observable = params.observable;
        // this.subscriber = params.subscriber;
    }

    // public next(value?: unknown) {
    //     this.subscriber.next(value);
    // }
    // public registerContextStream(stream: Readable) {
    //     this.subscriber.next(stream);

    //     stream.on('data', chunk => {
    //         // console.log(chunk)
    //     }).on('close', () => {
    //         // console.log('CLOSED');
    //     });
    // }
}
export interface TransmutationModule {
    transmute(observable: TransmuteContext): Observable<Context>;
}

export interface ResolveTransmutationModuleContextParams {
    variables?: ResolveTransmutationModuleContext['variables'];
}
export class ResolveTransmutationModuleContext {
    public readonly variables: Record<string, string>;

    public constructor(params: ResolveTransmutationModuleContextParams) {
        this.variables = params.variables ?? {};
    }

    public resolveTemplate(template: string) {
        return _.template(template)(this.variables);
    }
}
export type TransmutationModuleFunction = (options: Record<string, unknown>, context: ResolveTransmutationModuleContext) => TransmutationModule | Promise<TransmutationModule>

// export interface IncantationParams {
//     incantationModule: Incantation['incantationModule'];
//     transmutations?: Incantation['transmutations'];
//     incantations?: Incantation['incantations'];
// }
// export class Incantation {
//     public incantationModule: IncantationModule;
//     public transmutations: Transmutation[];
//     public incantations: Incantation[];

//     public constructor(params: IncantationParams) {
//         this.incantationModule = params.incantationModule;
//         this.transmutations = params.transmutations ?? [];
//         this.incantations = params.incantations ?? [];
//     }

//     public async transmute() {
//         for (const transmutation of this.transmutations) {
//             await transmutation.transmute();
//         }

//         await Bluebird.map(this.incantations, async incantation => await incantation.transmute());
//     }
// }

// export interface TransmutationParams {
//     transmutationModule: Transmutation['transmutationModule'];
// }
// export class Transmutation {
//     public transmutationModule: TransmutationModule;

//     public constructor(params: TransmutationParams) {
//         this.transmutationModule = params.transmutationModule;
//     }

//     public async transmute() {
//         await this.transmutationModule.transmute();
//     }
// }

// export const TransmutationModuleType = FT.object({
//     default: FT.function([ FT.unknown(), FT.object({}) ], FT.union([ FT.unknown(), FT.unknown().promised() ]))
// }).compile();

// export async function resolveTransmutationModule(moduleUri: string) {
//     const loadedModule = await import(moduleUri) as unknown;
//     if (!TransmutationModuleType.check(loadedModule))
//         throw new FluentTypeCheckError('module validation failed', TransmutationModuleType, loadedModule);

//     const transmutation = await loadedModule.default();
// }
