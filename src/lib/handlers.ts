import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import { Arguments, CommandBuilder } from 'yargs';
import * as Chalk from 'chalk';

import * as Path from 'path';
import * as FS from 'fs-extra';
import * as Yaml from 'js-yaml';

import { IManifest } from './manifest';
import { IDataAdapter } from './dataAdapter';
import { Context } from './context';
import { ManifestWorkflow } from './manifest';
import { debug, resolveModuleIdentifier } from '../lib/utils';

export interface TransmuteParams {
    env?: string[];
    runtimeArgs?: Record<string, string>;
    dataAdapter: IDataAdapter;
    manifestBasePath?: string,
    loadedManifest: IManifest;
    contextValues: Record<string, string>;
}
export async function transmute({ env, runtimeArgs = {}, dataAdapter, loadedManifest, manifestBasePath, contextValues }: TransmuteParams) {
    console.log(Chalk.blue('Transmuting...'));

    const loadedEnvs = await Bluebird.mapSeries(env || [], path => FS.readFile(path, 'utf8').then(content => Yaml.safeLoad(content)));
    const envVars = _.assign({}, ...loadedEnvs);

    let contextBasePath: string | undefined;

    let contexts = await (async () => {
        if (_.isString(loadedManifest.context)) {
            // const contextPath = Path.resolve(Path.dirname(loadedManifest.path), loadedManifest.manifest.context);
            const contextPath = await resolveModuleIdentifier(loadedManifest.context, manifestBasePath);
            contextBasePath = Path.dirname(contextPath);

            return dataAdapter.loadContext(contextPath);
        }
        else if (_.isArray(loadedManifest.context)) {
            return Bluebird.map(loadedManifest.context, async (context) => {
                if (_.isString(context)) {
                    // const contextPath = Path.resolve(Path.dirname(loadedManifest.path), context);
                    const contextPath = await resolveModuleIdentifier(context, manifestBasePath);
                    contextBasePath = Path.dirname(contextPath);

                    return dataAdapter.loadContext(contextPath);
                }
                else {
                    return context;
                }
            }).then(_.flatten);
        }
        else {
            return [ loadedManifest.context || new Context({}) ];
        }
    })().then(contexts => {
        for (const context of contexts)
            _.extend(context.payload, contextValues);

        return contexts;
    });

    // const loadedRendererManifest = await (async () => {
    //     if (loadedManifest.manifest.renderer) {
    //         if (_.isString(loadedManifest.manifest.renderer)) {
    //             const manifestPath = Path.resolve(Path.dirname(loadedManifest.path), loadedManifest.manifest.renderer);
    //             const manifest = await dataAdapter.loadRendererManifest(manifestPath);
    //             const renderer = await dataAdapter.loadRenderer(await resolveModuleIdentifier(manifest.engine, Path.dirname(manifestPath)), manifest.options, {
    //                 basePath: Path.dirname(manifestPath)
    //             });

    //             return {
    //                 manifest,
    //                 renderer
    //             };
    //         }
    //         else {
    //             const manifest = loadedManifest.manifest.renderer;
    //             const renderer = await dataAdapter.loadRenderer(await resolveModuleIdentifier(manifest.engine, Path.dirname(loadedManifest.path)), manifest.options, {
    //                 basePath: Path.dirname(loadedManifest.path)
    //             });

    //             return {
    //                 manifest,
    //                 renderer
    //             };
    //         }
    //     }
    // })();

    // const transforms = await (async () => {
    //     const transformPaths = await Bluebird.map(loadedManifest.manifest.transforms, path => resolveModuleIdentifier(path, Path.dirname(loadedManifest.path)));

    //     return Bluebird.map(transformPaths, (transform => dataAdapter.loadTransform(transform)));
    // })();

    // const outputPath = (() => {
    //     if (loadedManifest.manifest.output)
    //         return Path.resolve(Path.dirname(loadedManifest.path), loadedManifest.manifest.output);
    // })();

    // const contextPath = resolveContextPath(argv, loadedManifest);
    // const transformPaths = await resolveTransformPaths(argv, loadedManifest);
    // const outputPath = resolveOutputPath(argv, loadedManifest);
    // const rendererManifestPath = resolveRendererManifestPath(argv, loadedManifest);

    // if (!contextPath)
    //     throw new Error('Context required');

    // let context = await dataAdapter.loadContext(contextPath);
    // const transforms = await Bluebird.map(transformPaths, (transform => dataAdapter.loadTransform(transform)));

    // for (const transform of transforms) {
    //     console.log(`  ${Chalk.grey(`Transforming "${transform.name}"...`)}`);
    //     context = await transform.transform(context);
    // }

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

    for (const stage of loadedManifest.stages) {
        // console.log(`  ${Chalk.cyan(`Executing step "${stage.name}"...`)}`);

        const transform = await (async () => {
            if (stage.transform) {
                if (_.isString(stage.transform)) {
                    const basePath = Path.dirname(stage.transform);

                    return dataAdapter.loadTransform(await resolveModuleIdentifier(stage.transform, manifestBasePath), {}, {
                        basePath,
                        manifestBasePath,
                        contextBasePath,
                        runtimeArgs
                    });
                }
                else {
                    const basePath = Path.dirname(stage.transform.module);

                    return dataAdapter.loadTransform(await resolveModuleIdentifier(stage.transform.module, manifestBasePath), stage.transform.options, {
                        basePath,
                        manifestBasePath,
                        contextBasePath,
                        runtimeArgs
                    }, stage.transform.includedContexts.slice(), stage.transform.excludedContexts.slice());
                }
            }
        })();

        const loadedRendererManifest = await (async () => {
            if (stage.renderer) {
                if (_.isString(stage.renderer)) {
                    // const manifestPath = Path.resolve(manifestBasePath, stage.renderer);
                    const manifestPath = await resolveModuleIdentifier(stage.renderer, manifestBasePath);
                    const basePath = Path.dirname(manifestPath);

                    const manifest = await dataAdapter.loadRendererManifest(manifestPath);
                    const renderer = await dataAdapter.loadRenderer(await resolveModuleIdentifier(manifest.engine, basePath), manifest.options, {
                        basePath
                    });

                    return {
                        manifest,
                        renderer
                    };
                }
                else {
                    const basePath = manifestBasePath;

                    const manifest = stage.renderer;
                    const renderer = await dataAdapter.loadRenderer(await resolveModuleIdentifier(manifest.engine, basePath), manifest.options, {
                        basePath
                    });

                    return {
                        manifest,
                        renderer
                    };
                }
            }
        })();

        // const outputPath = (() => {
        //     if (stage.output)
        //         return Path.resolve(Path.dirname(loadedManifest.path), stage.output);
        // })();

        if (transform) {
            console.log(`    [${Chalk.cyan(stage.name)}] ${Chalk.grey(`Running transform "${transform.name}"...`)}`);

            const transformedContexts: Context[] = [];
            if (stage.mergeContexts) {
                transformedContexts.push(...await transform.transform(new Context({
                    mergedContexts: contexts.slice(),
                })));
            }
            else {
                for (const context of contexts) {
                    if (!context.qualifier || transform.applicableContext(context.qualifier)) {
                        transformedContexts.push(...await transform.transform(context));
                    }
                    else {
                        transformedContexts.push(context);
                    }
                }
            }

            contexts = transformedContexts;
        }
        else if (stage.mergeContexts) {
            contexts = [
                new Context({
                    mergedContexts: contexts.slice()
                })
            ];
        }

        if (loadedRendererManifest) {
            if (stage.output) {
                if (stage.output === 'stdout') {
                    for (const context of contexts) {
                        const result = await loadedRendererManifest.renderer.render(context);

                        for (const resultItem of (_.isArray(result) ? result : [ result ]))
                            process.stdout.write(resultItem.buffer);
                    }
                }
                else {
                    const outputPathTemplate = _.template(stage.output);

                    await Bluebird.map(contexts, async context => {
                        const result = await loadedRendererManifest.renderer.render(context);

                        // console.log(context.qualifier)
                        // console.log(contextOutputPath)

                        // console.log(result.toString('utf8'));

                        for (const resultItem of (_.isArray(result) ? result : [ result ])) {
                            const outputPath = outputPathTemplate(_.assign({ cwd: Path.resolve() }, envVars, context, {
                                contextQualifier: context.qualifier ?? '.'
                            }, {
                                rendererQualifier: resultItem.qualifier ?? '.'
                            }));
                            const contextOutputPath = Path.isAbsolute(outputPath) ? outputPath : Path.resolve(manifestBasePath ?? '.', outputPath);

                            console.log(`    [${Chalk.cyan(stage.name)}] ${Chalk.grey(`Rendering output to "${contextOutputPath}"...`)}`);

                            await FS.outputFile(contextOutputPath, resultItem.buffer);
                        }
                    });
                }
            }
        }

        // if (loadedRendererManifest) {
        //     console.log(`    ${Chalk.grey(`Rendering output...`)}`);
        //     const result = await loadedRendererManifest.renderer.render(context);

        //     if (outputPath) {
        //         console.log(`    ${Chalk.grey(`Writing output to "${outputPath}"`)}`);
        //         await FS.outputFile(outputPath, result);
        //     }
        //     else {
        //         console.log(result.toString('utf8'));
        //     }
        // }
        // else {
        //     if (outputPath)
        //         console.log(`    ${Chalk.grey(`Writing output to "${outputPath}"`)}`);
        //     else
        //         console.log(context);
        // }
    }

    const processWorkflow = async (workflow: ManifestWorkflow, contexts: Context[], contextBasePath: string | undefined, prefix?: string) => {
        const workflowName = prefix ? `${prefix} / ${workflow.name}` : workflow.name;

        // let contextBasePath: string | undefined;

        let workflowContexts: Context[];
        if (workflow.context) {
            const workflowContext = workflow.context;

            workflowContexts = await (async () => {
                if (_.isString(workflowContext)) {
                    // const contextPath = Path.resolve(manifestBasePath, workflowContext);
                    const contextPath = await resolveModuleIdentifier(workflowContext, manifestBasePath);
                    contextBasePath = Path.dirname(contextPath);

                    return dataAdapter.loadContext(contextPath);
                }
                else if (_.isArray(workflowContext)) {
                    return Bluebird.map(workflowContext, async (context) => {
                        if (_.isString(context)) {
                            // const contextPath = Path.resolve(manifestBasePath, context);
                            const contextPath = await resolveModuleIdentifier(context, manifestBasePath);
                            contextBasePath = Path.dirname(contextPath);

                            return dataAdapter.loadContext(contextPath);
                        }
                        else {
                            return context;
                        }
                    }).then(_.flatten);
                }
                else {
                    return [ workflowContext ];
                }
            })();
        }
        else {
            workflowContexts = contexts.map(context => context.clone());
        }

        if (workflow.includedContexts.length) {
            workflowContexts = workflowContexts.filter(context => workflow.includedContexts.every(key => context.keys && context.keys.some(contextKey => contextKey === key)));
        }

        if (!workflowContexts.length)
            return;

        for (const stage of workflow.stages) {
            // console.log(`  [${Chalk.magenta(workflow.name)}] ${Chalk.cyan(`Executing step "${stage.name}"...`)}`);

            const transform = await (async () => {
                if (stage.transform) {
                    if (_.isString(stage.transform)) {
                        const basePath = Path.dirname(stage.transform);

                        return dataAdapter.loadTransform(await resolveModuleIdentifier(stage.transform, manifestBasePath), {}, {
                            basePath,
                            manifestBasePath,
                            contextBasePath,
                            runtimeArgs
                        });
                    }
                    else {
                        const basePath = Path.dirname(stage.transform.module);

                        return dataAdapter.loadTransform(await resolveModuleIdentifier(stage.transform.module, manifestBasePath), stage.transform.options, {
                            basePath,
                            manifestBasePath,
                            contextBasePath,
                            runtimeArgs
                        }, stage.transform.includedContexts.slice(), stage.transform.excludedContexts.slice());
                    }
                }
            })();

            const loadedRendererManifest = await (async () => {
                if (stage.renderer) {
                    if (_.isString(stage.renderer)) {
                        // const manifestPath = Path.resolve(manifestBasePath, stage.renderer);
                        const manifestPath = await resolveModuleIdentifier(stage.renderer, manifestBasePath);
                        const basePath = Path.dirname(manifestPath);

                        const manifest = await dataAdapter.loadRendererManifest(manifestPath);
                        const renderer = await dataAdapter.loadRenderer(await resolveModuleIdentifier(manifest.engine, basePath), manifest.options, {
                            basePath
                        });

                        return {
                            manifest,
                            renderer
                        };
                    }
                    else {
                        const basePath = manifestBasePath;

                        const manifest = stage.renderer;
                        const renderer = await dataAdapter.loadRenderer(await resolveModuleIdentifier(manifest.engine, basePath), manifest.options, {
                            basePath
                        });

                        return {
                            manifest,
                            renderer
                        };
                    }
                }
            })();

            // const outputPath = (() => {
            //     if (stage.output)
            //         return Path.resolve(manifestBasePath, stage.output);
            // })();

            if (transform) {
                console.log(`    [${Chalk.magenta(workflowName)} / ${Chalk.cyan(stage.name)}] ${Chalk.grey(`Running transform "${transform.name}"...`)}`);

                const transformedContexts: Context[] = [];
                if (stage.mergeContexts) {
                    transformedContexts.push(...await transform.transform(new Context({
                        mergedContexts: workflowContexts.slice()
                    })));
                }
                else {
                    for (const context of workflowContexts) {
                        if (!context.qualifier || transform.applicableContext(context.qualifier)) {
                            transformedContexts.push(...await transform.transform(context));
                        }
                        else {
                            transformedContexts.push(context);
                        }
                    }
                }

                workflowContexts = transformedContexts;
            }
            else if (stage.mergeContexts) {
                contexts = [
                    new Context({
                        mergedContexts: contexts.slice()
                    })
                ];
            }

            if (loadedRendererManifest) {
                if (stage.output) {
                    if (stage.output === 'stdout') {
                        for (const context of contexts) {
                            const result = await loadedRendererManifest.renderer.render(context);

                            for (const resultItem of (_.isArray(result) ? result : [ result ]))
                                process.stdout.write(resultItem.buffer);
                        }
                    }
                    else {
                        const outputPathTemplate = _.template(stage.output);

                        await Bluebird.map(workflowContexts, async context => {
                            const result = await loadedRendererManifest.renderer.render(context);

                            // console.log(context.qualifier)
                            // console.log(contextOutputPath)

                            // console.log(result.toString('utf8'));

                            for (const resultItem of (_.isArray(result) ? result : [ result ])) {
                                const outputPath = outputPathTemplate(_.assign({ cwd: Path.resolve() }, envVars, context, {
                                    contextQualifier: context.qualifier ?? '.'
                                }, {
                                    rendererQualifier: resultItem.qualifier ?? '.'
                                }));
                                const contextOutputPath = Path.isAbsolute(outputPath) ? outputPath : Path.resolve(manifestBasePath ?? '.', outputPath);
    
                                console.log(`    [${Chalk.magenta(workflowName)} / ${Chalk.cyan(stage.name)}] ${Chalk.grey(`Rendering output to "${contextOutputPath}"...`)}`);

                                await FS.outputFile(contextOutputPath, resultItem.buffer);
                            }
                        });
                    }
                }
            }

            // if (loadedRendererManifest) {
            //     console.log(`    [${Chalk.magenta(workflow.name)}] ${Chalk.grey(`Rendering output...`)}`);
            //     const result = await loadedRendererManifest.renderer.render(workflowContext);

            //     if (outputPath) {
            //         console.log(`    [${Chalk.magenta(workflow.name)}] ${Chalk.grey(`Writing output to "${outputPath}"`)}`);
            //         await FS.outputFile(outputPath, result);
            //     }
            //     else {
            //         console.log(result.toString('utf8'));
            //     }
            // }
            // else {
            //     if (outputPath)
            //         console.log(`    [${Chalk.magenta(workflow.name)}] ${Chalk.grey(`Writing output to "${outputPath}"`)}`);
            //     else
            //         console.log(workflowContext);
            // }
        }

        await Bluebird.map(workflow.workflows, (workflow) => processWorkflow(workflow, workflowContexts, contextBasePath, workflowName));
    };

    await Bluebird.map(loadedManifest.workflows, (workflow) => processWorkflow(workflow, contexts, contextBasePath));

    console.log(`${Chalk.blue('Done')} (${Chalk.green('Success')})`);
}
