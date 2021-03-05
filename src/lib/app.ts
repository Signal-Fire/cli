'use strict'

import { Server } from 'http'
import createApp from '@signal-fire/server'
import { LocalRegistry, Registry } from '@lucets/registry'

import { WorkerConfiguration } from './util'

export function loadRegistry (config: WorkerConfiguration['registry']): Registry {
  if (config === 'local') {
    return new LocalRegistry()
  }

  let Constructor: any

  try {
    Constructor = require(config.name)

    if (Constructor.default) {
      Constructor = Constructor.default
    }
  } catch (e) {
    throw new Error(`Unable to import registry '${config.name}'`)
  }

  try {
    const registry = new Constructor(...(config.args ?? []))
    return registry
  } catch (e) {
    throw new Error(`Unable to instantiate registry '${config.name}'`)
  }
}

export default function createServer (config: WorkerConfiguration): Server {
  const registry = loadRegistry(config.registry)
  const app = createApp(registry)
  const server = new Server(/* TODO: Add request listener */)

  server.on('upgrade', app.onUpgrade())
  return server
}
