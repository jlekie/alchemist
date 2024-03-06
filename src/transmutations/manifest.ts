import { FluentType as FT, FluentTypeCheckError } from '@jlekie/fluent-typebox';

import * as Path from 'path';
import * as FS from 'fs-extra';

import { Observable, concatAll, from, map, mergeMap } from 'rxjs';

import { Transmutation, Manifest, Context } from '..';

interface ManifestTransmutationParams {
    manifest: ManifestTransmutation['manifest'];
    variables?: ManifestTransmutation['variables'] | undefined;
}
class ManifestTransmutation implements Transmutation.TransmutationModule {
    public readonly manifest: Manifest.Manifest;
    public readonly variables: Record<string, string>;

    public constructor(params: ManifestTransmutationParams) {
        this.manifest = params.manifest;
        this.variables = params.variables ?? {};
    }

    public transmute(params: Transmutation.TransmuteContext): Observable<Context.Context> {
        return params.observable.pipe(observable => this.manifest.transmute(observable, this.variables));
    }
}

const OptionsTypeCheck = FT.object({
    path: FT.string(),
    variables: FT.record(FT.string(), FT.string()).optional()
}).compile();

export default (async (options, params) => {
    if (!OptionsTypeCheck.check(options))
        throw new FluentTypeCheckError('options validation failed', OptionsTypeCheck, options);

    const manifestPath = require.resolve(Manifest.resolveTemplate(options.path, params.variables));
    // const manifestPath = Path.resolve(Manifest.resolveTemplate(options.path, params.variables));
    const manifest = await Manifest.loadManifest(manifestPath);

    return new ManifestTransmutation({
        manifest,
        variables: options.variables
    });
}) satisfies Transmutation.TransmutationModuleFunction;
