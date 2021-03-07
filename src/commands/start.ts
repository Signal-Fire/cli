'use strict'

import { resolve } from 'path'
import { ChildProcess } from 'child_process'

import Wormhole from '@art-of-coding/wormhole'

import { WorkerConfiguration, readJSON, spawnWorker, portAvailable, isNumber } from '../lib/util'

export interface StartOptions {
  config?: string,
  port?: string,
  host?: string,
  path?: string
}

export default async function start (opts: StartOptions): Promise<void> {
  console.log('Starting a new worker\n')

  let config: WorkerConfiguration = {
    registry: 'local',
    api: true,
    app: {}
  }

  if (opts.config) {
    // Load from configuration
    try {
      config = {
        ...config,
        ...(await readJSON(resolve(process.cwd(), opts.config)))
      }
    } catch (e) {
      console.log('Error: unable to load configuration file')
      console.error(e)
      return
    }
  } else {
    if (opts.host) {
      config.app.host = opts.host
    }

    if (opts.port) {
      if (!isNumber(opts.port)) {
        console.log('Expected \'port\' to be a number')
        return
      }

      config.app.port = parseInt(opts.port)
    }

    if (opts.path) {
      if (!opts.path.startsWith('/')) {
        console.log('Expected \'path\' to start with a forward slash (/)')
        return
      }

      config.app.pathname = opts.path
    }
  }

  // Check port availability
  if (config.app.port) {
    const { port } = config.app
    const available = await portAvailable(port)

    if (!available) {
      console.log(`Port ${port} is not available`)
      return
    }
  }

  let worker: ChildProcess
  let wormhole: Wormhole

  try {
    [ worker, wormhole ] = await spawnWorker()
  } catch (e) {
    console.log('\nUnable to spawn worker')
    return
  }

  try {
    await wormhole.command<void>('configure', config)
  } catch (e) {
    console.log('\nUnable to configure worker')
    return
  }

  let appPort: number

  try {
    appPort = await wormhole.command<number>('start')
  } catch (e) {
    console.log('\nUnable to start worker')
    return
  }

  console.log(`Worker has been started on port ${appPort}`)

  wormhole.disconnect()
  worker.unref()
}
