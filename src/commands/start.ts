'use strict'

import { resolve } from 'path'
import { ChildProcess } from 'child_process'

import Wormhole from '@art-of-coding/wormhole'

import { WorkerConfiguration, readJSON, spawnWorker, portAvailable } from '../lib/util'

export interface StartOptions {
  config?: string,
  port?: string,
  host?: string,
  path?: string
}

export default async function start (opts: StartOptions): Promise<void> {
  let config: WorkerConfiguration = {
    registry: 'local',
    server: {}
  }

  if (opts.config) {
    // Load from configuration
    try {
      config = await readJSON(resolve(process.cwd(), opts.config))
    } catch (e) {
      console.log('Error: unable to load configuration file')
      console.error(e)
      return
    }
  } else {
    if (opts.host) {
      config.server.host = opts.host
    }

    if (opts.port) {
      const port = parseInt(opts.port)
      const available = await portAvailable(port)

      if (!available) {
        console.log(`Port ${port} is not available`)
        return
      }

      config.server.port = port
    }

    if (opts.path) {
      config.server.pathname = opts.path
    }
  }

  //
  let worker: ChildProcess
  let wormhole: Wormhole

  try {
    [ worker, wormhole ] = await spawnWorker()
  } catch (e) {
    console.log('\nUnable to spawn worker')
    console.error(e)
    return
  }

  try {
    await wormhole.command<void>('configure', config)
  } catch (e) {
    console.log('\nUnable to configure worker')
    console.error(e)
    return
  }

  let appPort: number

  try {
    appPort = await wormhole.command<number>('start')
  } catch (e) {
    console.log('\nUnable to start worker')
    console.error(e)
    return
  }

  console.log(`\nWorker has been started on port ${appPort}`)

  wormhole.disconnect()
  worker.unref()
}
