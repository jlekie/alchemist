#!/usr/bin/env node

import 'source-map-support/register';

import * as Yargs from 'yargs';
import Chalk from 'chalk';

import { debug } from './lib/utils';

const argv = Yargs
    .commandDir('./commands')
    // .command('test', 'Test Command', {
    // }, async (argv) => {
    //     console.log('testing', argv);
    //     await delay(1000);
    //     console.log('done');
    // })
    .help('h')
    .alias('h', 'help')
    .showHelpOnFail(true)
    .demandCommand()
    .recommendCommands().strict()
    .fail((msg, err) => {
        console.log(Chalk.red(msg || err.message));
        console.log(err.stack);
        debug('yargs fail', { msg, err });
    })
    .argv;