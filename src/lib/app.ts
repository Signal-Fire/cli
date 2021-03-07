'use strict'

import { Server, IncomingMessage, ServerResponse, STATUS_CODES } from 'http'
import { parse } from 'url'

import createApp from '@signal-fire/server'
import { LocalRegistry, Registry } from '@lucets/registry'

import { WorkerConfiguration } from './util'

export function loadRegistry (config: WorkerConfiguration['registry']): Registry {
  if (config === 'local') {
    return new LocalRegistry()
  } else if (typeof config === 'string') {
    config = { name: config }
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

function handleRequest (path?: string): (req: IncomingMessage, res: ServerResponse) => void {
  return function requestHandler (req, res) {
    let statusCode = path ? 404 : 426

    if (path && parse(req.url).pathname === path) {
      statusCode = 426
    }

    const message = STATUS_CODES[statusCode]
    res.writeHead(statusCode, message, {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(message),
      'Connection': 'close'
    })

    res.end(message)
  }
}

export default function createServer (config: WorkerConfiguration): Server {
  const registry = loadRegistry(config.registry)
  const app = createApp(registry, config.rtcConfig)
  const server = new Server(handleRequest(config.app?.pathname))

  server.on('upgrade', app.onUpgrade())
  return server
}
