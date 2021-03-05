'use strict'

import { resolve } from 'path'
import { ChildProcess } from 'child_process'

import Wormhole from '@art-of-coding/wormhole'

import { WorkerConfiguration, readJSON, spawnWorker } from '../lib/util'

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
      config.server.port = parseInt(opts.port)
    }

    if (opts.path) {
      config.server.path = opts.path
    }
  }

  //
  let worker: ChildProcess
  let wormhole: Wormhole

  try {
    [ worker, wormhole ] = await spawnWorker({ detached: true })
  } catch (e) {
    console.log('Unable to spawn worker')
    console.error(e)
    return
  }

  try {
    await wormhole.command<void>('configure', config)
  } catch (e) {
    console.log('Unable to configure worker')
    console.error(e)
    return
  }

  try {
    await wormhole.command<void>('start')
  } catch (e) {
    console.log('Unable to start worker')
    console.error(e)
    return
  }

  console.log(`Worker has been started with PID ${worker.pid}`)

  wormhole.disconnect()
  worker.unref()

  console.log('Worker detached')
}
