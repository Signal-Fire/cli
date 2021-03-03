'use strict'

import { Server } from  'http'
import createApp, { Application } from '@signal-fire/server'
import Wormhole from '@art-of-coding/wormhole'

import importRegistry from './importRegistry'
import handleRequest from './handleRequest'
import { LocalRegistry, Registry } from '@lucets/registry'

import { InitConfiguration } from '../createWorker'

let server: Server
let registry: Registry
let app: Application

async function initCommand (config: InitConfiguration): Promise<void> {
  if (server) {
    throw new Error('Already initialized')
  }

  server = new Server(handleRequest(config.server?.path))
  registry = (!config.registry || config.registry === 'local')
    ? new LocalRegistry()
    : await importRegistry(config.registry.name, config.registry.args)
  app = createApp(registry)
}

async function startCommand (...args: any[]): Promise<void> {
  if (!server) {
    throw new Error('Not initialized')
  } else if (server.listening) {
    throw new Error('Server already listening')
  }

  return new Promise<void>((resolve, reject) => {
    args.push((err?: Error) => {
      if (err) return reject(err)
      resolve()
    })

    server.listen(...args)
  })
}

async function stopCommand (): Promise<void> {
  if (!server) {
    throw new Error('Not initialized')
  } else if (!server.listening) {
    throw new Error('Server not listening')
  }

  return new Promise<void>((resolve, reject) => {
    server.once('close', resolve)
    server.close(err => {
      if (err) {
        server.removeListener('close', resolve)
        reject(err)
      }
    })
  })
}

async function cleanCommand (): Promise<void> {
  if (server.listening) {
    await stopCommand()
  }

  server = null
  registry = null
  app = null
}

const wormhole = new Wormhole(process)

wormhole.define('init', initCommand)
wormhole.define('start', startCommand)
wormhole.define('stop', stopCommand)
wormhole.define('clean', cleanCommand)

setImmediate(() => {
  wormhole.event('ready')
})
