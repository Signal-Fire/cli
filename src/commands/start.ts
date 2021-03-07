'use strict'

import { resolve } from 'path'
import { ChildProcess } from 'child_process'

import Wormhole from '@art-of-coding/wormhole'

import {
  WorkerConfiguration,
  readJSON,
  createWorker,
  portAvailable,
  isNumber
} from '../lib/util'
import { AddressInfo } from 'ws'

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
    [ worker, wormhole ] = await createWorker(config)
  } catch (e) {
    console.log('Unable to create worker')
    return
  }

  let address: AddressInfo

  try {
    address = await wormhole.command<AddressInfo>('start')
  } catch (e) {
    console.log('Unable to start worker')
    return
  }

  console.log(`Worker has been started on port ${address.port}`)

  wormhole.disconnect()
  worker.unref()
}
