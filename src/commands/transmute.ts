import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import { Arguments, CommandBuilder } from 'yargs';
import * as Chalk from 'chalk';

import * as Path from 'path';
import * as FS from 'fs-extra';
import * as Yaml from 'js-yaml';

import * as Url from 'url';

import * as Alchemist from '..';

import { debug, resolveModuleIdentifier } from '../lib/utils';

export interface CommandArguments {
    manifest: string;
    env: string[];
    arg: string[];
    contextValue: string[];
    cwd?: string;
}

interface LoadedManfiest {
    path: string;
    manifest: Alchemist.IManifest;
}

export const command = 'transmute <manifest>';
export const describe = 'Transmute context to code';

export const builder: CommandBuilder<CommandArguments> = {
    env: {
        array: true,
        default: []
    },
    arg: {
        array: true,
        default: []
    },
    contextValue: {
        array: true,
        default: []
    },
    cwd: {
        string: true
    }
};

export async function handler(argv: Arguments<CommandArguments>) {
    if (argv.cwd)
        process.chdir(argv.cwd);

    const dataAdapter = Alchemist.createDataAdapter();

    const [ loadedManifest, manifestBasePath ] = await dataAdapter.loadManifest(argv.manifest);

    const runtimeArgs = _.fromPairs(argv.arg.map(v => v.split('=', 2)));

    const contextValues = _.fromPairs(argv.contextValue.map(v => v.split('=', 2)));

    await Alchemist.transmute({
        env: argv.env,
        runtimeArgs,
        manifestBasePath,
        dataAdapter,
        loadedManifest,
        contextValues
    });
}
