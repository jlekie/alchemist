#!/usr/bin/env node
import 'source-map-support/register';

import * as Dotenv from 'dotenv';
Dotenv.config();

import { Builtins, Cli, Command, Option } from 'clipanion';
import Chalk from 'chalk';
import * as Path from 'path';
import * as FS from 'fs-extra';

import Bluebird from 'bluebird';

import { FluentType, FluentTypeCheckError } from '@jlekie/fluent-typebox';

import * as App from '.';

const PackageManifestType = FluentType.object({
    name: FluentType.string(),
    version: FluentType.string(),
    bin: FluentType.union([
        FluentType.string(),
        FluentType.record(FluentType.string(), FluentType.string())
    ]).optional()
}).compile();

process.on('uncaughtException', err => {
    console.log(Chalk.red(err.message));
    console.log(Chalk.red(err.stack))

    if (err instanceof FluentTypeCheckError) {
        for (const valueError of err.typeCheck.errors(err.value))
            console.log(Chalk.gray(`[${valueError.path}] ${valueError.message} <${valueError.value}>`));
    }
});

const [ node, app, ...args ] = process.argv;

class TransmuteCommand extends Command {
    static override paths = [['transmute']];

    static override usage? = Command.Usage({
        description: 'Transmute artifacts'
    });

    cwd = Option.String('--cwd');
    config = Option.String('--config,-c', 'alchemy.yml');

    public async execute() {
        if (this.cwd)
            process.chdir(this.cwd);

        const configPath = Path.resolve(this.cwd ?? '.', this.config);

        await App.transmute(configPath);

        // await Bluebird.delay(5000);
    }
}

const packageManifest = FS.readJsonSync(Path.resolve(__dirname, '../package.json')) as unknown;
if (!PackageManifestType.check(packageManifest))
    throw new FluentTypeCheckError('package manifest validation failed', PackageManifestType, packageManifest);
const cli = new Cli({
    binaryName: `[ ${packageManifest.bin ? (typeof packageManifest.bin === 'string' ? packageManifest.name : Object.keys(packageManifest.bin)) : packageManifest.name} ]`,
    binaryLabel: 'Alchemist',
    binaryVersion: packageManifest.version
});

cli.register(TransmuteCommand);

cli.register(Builtins.HelpCommand);
cli.register(Builtins.VersionCommand);

cli.runExit(args).catch(err => {
    throw new Error(`Application failed to launch; ${err}`);
});
