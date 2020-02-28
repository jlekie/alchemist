import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import { Arguments, CommandBuilder } from 'yargs';
import Chalk from 'chalk';

import * as Path from 'path';
import * as FS from 'fs-extra';

import * as Alchemist from '..';

import { debug, resolveModuleIdentifier } from '../lib/utils';

export interface CommandArguments {
    context: string;
    transform: string[];
    output?: string;
    renderer: string;
}

export const command = 'render';
export const describe = 'Render context to code';

export const builder: CommandBuilder<CommandArguments> = {
    context: {
        string: true
    },
    transform: {
        array: true,
        default: []
    },
    output: {
        string: true
    },
    renderer: {
        string: true
    }
};

export async function handler(argv: Arguments<CommandArguments>) {
    console.log(Chalk.blue('Transmuting...'));

    const dataAdapter = Alchemist.createDataAdapter();

    let contexts = await (async () => {
        const contextPath = Path.resolve(argv.context);
        return dataAdapter.loadContext(contextPath);
    })();

    const loadedRendererManifest = await (async () => {
        const manifestPath = Path.resolve(argv.renderer);
        const manifest = await dataAdapter.loadRendererManifest(manifestPath);
        const renderer = await dataAdapter.loadRenderer(await resolveModuleIdentifier(manifest.engine, Path.dirname(manifestPath)), manifest.options, {
            basePath: Path.dirname(manifestPath)
        });

        return {
            manifest,
            renderer
        };
    })();

    const transforms = await (async () => {
        const transformPaths = await Bluebird.map(argv.transform, path => resolveModuleIdentifier(path));

        return Bluebird.map(transformPaths, (transform => dataAdapter.loadTransform(transform, {}, {
            basePath: Path.dirname(transform),
            manifestBasePath: Path.dirname(transform)
        })));
    })();

    const outputPath = (() => {
        if (argv.output)
            return Path.resolve(argv.output);
    })();

    // const contextPath = resolveContextPath(argv, loadedManifest);
    // const transformPaths = await resolveTransformPaths(argv, loadedManifest);
    // const outputPath = resolveOutputPath(argv, loadedManifest);
    // const rendererManifestPath = resolveRendererManifestPath(argv, loadedManifest);

    // if (!contextPath)
    //     throw new Error('Context required');

    // let context = await dataAdapter.loadContext(contextPath);
    // const transforms = await Bluebird.map(transformPaths, (transform => dataAdapter.loadTransform(transform)));

    for (const transform of transforms) {
        console.log(`  ${Chalk.grey(`Transforming "${transform.name}"...`)}`);
        // context = await transform.transform(context);

        const transformedContexts: Alchemist.Context[] = [];
        for (const context of contexts) {
            transformedContexts.push(...await transform.transform(context));
        }

        contexts = transformedContexts;
    }

    if (loadedRendererManifest) {
        console.log(`  ${Chalk.grey(`Rendering...`)}`);

        for (const context of contexts) {
            const result = await loadedRendererManifest.renderer.render(context);

            console.log(result.toString('utf8'));
        }
    }

    // if (loadedRendererManifest) {
    //     console.log(`  ${Chalk.grey(`Rendering...`)}`);
    //     const result = await loadedRendererManifest.renderer.render(context);

    //     if (outputPath) {
    //         debug(`Writing rendered result to ${outputPath}`);
    //         await FS.writeFile(outputPath, result);
    //     }
    //     else {
    //         console.log(result.toString('utf8'));
    //     }
    // }
    // else {
    //     console.log(context);
    // }

    console.log(`${Chalk.blue('Done')} (${Chalk.green('Success')})`);
}