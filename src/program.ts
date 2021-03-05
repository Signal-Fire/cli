#!/usr/bin/env node

'use strict'

import { Command } from 'commander'

import start from './commands/start'
import stop from './commands/stop'
import info from './commands/info'
import list from './commands/list'

const { version } = require('../package')
const program = new Command()

program
  .name('signal-fire')
  .version(version)
  .command('start')
  .description('start a new worker')
  .option('-p, --port <port>', 'port to listen on')
  .option('-c, --config <file>', 'path to configuration file')
  .option('-h, --host <host>', 'host to listen on')
  .option('-P, --path <path>', 'path to listen on')
  .action(start)

program
  .command('stop <pid>')
  .description('stop worker with the given pid')
  .action(stop)

program
  .command('info <pid>')
  .description('list info for worker')
  .option('-t, --token', 'include api token in output', false)
  .action(info)

program
  .command('list')
  .description('list all active workers')
  .option('-t, --token', 'include api token in output', false)
  .action(list)

program.parse(process.argv)
