'use strict'

import { Server } from 'http'
import { AddressInfo } from 'net'

import Wormhole from '@art-of-coding/wormhole'
import { nanoid } from 'nanoid/async'

import createApp from './lib/app'
import createApi from './lib/api'
import { WorkerConfiguration, closeServer, listenServer } from './lib/util'
import { setProcess, deleteProcess } from './lib/process'

const wormhole = new Wormhole(process)

let configuration: WorkerConfiguration
let apiServer: Server
let appServer: Server

/** Initializes the worker. */
async function init (): Promise<void> {
  // Add the process to the process list
  await setProcess({
    pid: process.pid,
    createdOn: new Date().toISOString()
  })
}

/** Called when initialization is complete */
async function initComplete (): Promise<void> {
  await wormhole.event('ready')
}

/** Called when initialization has failed */
async function initError (): Promise<void> {
  // Exit the proces ungracefully
  process.exit(-1)
}

/** Configure the app server */
async function configure (config: WorkerConfiguration): Promise<void> {
  if (appServer) {
    throw new Error('Worker already configured')
  }

  configuration = config

  if (config.api) {
    const apiToken = await nanoid()
    apiServer = createApi({ token: apiToken })

    if (config.api === true) {
      await listenServer(apiServer)
    } else if (typeof config.api === 'number') {
      await listenServer(apiServer, { port: config.api })
    } else {
      await listenServer(apiServer, config.api)
    }

    const address = <AddressInfo>apiServer.address()

    await setProcess({
      pid: process.pid,
      apiPort: address.port,
      apiToken
    })
  }

  appServer = createApp(config)
}

/** Start the app server */
async function start (): Promise<AddressInfo> {
  if (appServer?.listening) {
    throw new Error('Server already started')
  }

  if (typeof configuration.app === 'number') {
    await listenServer(appServer, { port: configuration.app })
  } else if (Object.keys(configuration.app).length) {
    await listenServer(appServer, configuration.app)
  } else {
    await listenServer(appServer)
  }

  const address = <AddressInfo>appServer.address()

  // Update the process file with the app port
  await setProcess({
    pid: process.pid,
    appPort: address.port
  })

  if (wormhole.connected) {
    await wormhole.event('started', address)
  }

  return address
}

/** Stop the app server */
async function stop (): Promise<void> {
  if (appServer?.listening) {
    await closeServer(appServer)

    if (wormhole.connected) {
      await wormhole.event('stopped')
    }
  }
}

/** Dispose of everything and clean up */
async function dispose (): Promise<void> {
  if (apiServer?.listening) {
    await closeServer(apiServer)
  }

  if (appServer?.listening) {
    await closeServer(appServer)
  }

  if (wormhole.connected) {
    await wormhole.event('dispose')
    wormhole.disconnect()
  }

  await deleteProcess(process.pid)

  process.exit(0)
}

// Define IPC commands
wormhole.define('configure', configure)
wormhole.define('start', start)
wormhole.define('stop', stop)
wormhole.define('dispose', dispose)

// Set signal handler
process.once('SIGTERM', dispose)

// Initialize the worker
init()
  .then(initComplete)
  .catch(initError)
