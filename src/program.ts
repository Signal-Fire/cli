#!/usr/bin/env node

'use strict'

import { Command, option } from 'commander'

import serve from './commands/serve'

const { version } = require('../package')
const program = new Command()

program
  .version(version)
  .name('signal-fire')
  .command('serve')
  .description('serve a server')
  .option('-c, --config <path>', 'use a configuration file')
  .option('-p, --port <port>', 'server port (default 3003)')
  .option('-P, --path <path>', 'path to accept upgrades on')
  .option('-d, --detach', 'run server in detached mode', false)
  .action(serve)

program.parse(process.argv)
