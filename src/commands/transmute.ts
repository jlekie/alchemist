import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import { Arguments, CommandBuilder } from 'yargs';
import * as Chalk from 'chalk';

import * as Path from 'path';
import * as FS from 'fs-extra';
import * as Yaml from 'js-yaml';

import * as Alchemist from '..';

import { debug, resolveModuleIdentifier } from '../lib/utils';

export interface CommandArguments {
    manifest: string;
    env: string[];
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
};

export async function handler(argv: Arguments<CommandArguments>) {
    const dataAdapter = Alchemist.createDataAdapter();

    const manifestBasePath = Path.dirname(Path.resolve(argv.manifest));
    const loadedManifest = await (async () => {
        return {
            path: Path.resolve(argv.manifest),
            manifest: await dataAdapter.loadManifest(Path.resolve(argv.manifest))
        };
    })();

    await Alchemist.transmute({
        env: argv.env,
        manifestBasePath,
        dataAdapter,
        loadedManifest
    });
}