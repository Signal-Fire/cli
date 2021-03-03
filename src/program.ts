#!/usr/bin/env node

'use strict'

import { Command } from 'commander'
import createWorker, { InitConfiguration } from './createWorker'

const { version } = require('./package')
const program = new Command()

program
  .version(version)
  .name('signal-fire')
  .command('serve')
  .description('serve a server')
  .option('-p, --port <port>', 'server port', '3003')
  .option('--path <path>', 'path to accept upgrades on')
  .action(async options => {
    const worker = await createWorker()

    console.log('- Worker created')

    const config: InitConfiguration = {
      registry: 'local'
    }

    if (options.path) {
      config.server = {
        path: options.path
      }
    }

    await worker.command('init', config)

    console.log('- Worker initialized')

    await worker.command('start', parseInt(options.port))

    console.log(`- Server running on port ${options.port}`)
  })

program.parse(process.argv)
