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
  // Create the API server
  const apiToken = await nanoid()
  apiServer = createApi({
    token: apiToken
  })

  // Start the API server on any available port
  await listenServer(apiServer)

  // Add the process to the process list
  await setProcess({
    pid: process.pid,
    createdOn: new Date().toISOString(),
    apiPort: (<AddressInfo>apiServer.address()).port,
    apiToken
  })
}

/** Called when initialization is complete */
async function initComplete (): Promise<void> {
  // Send the API port with the ready event
  await wormhole.event('ready', (<AddressInfo>apiServer.address()).port)
}

/** Called when initialization has failed */
async function initError (): Promise<void> {
  // Exit the proces ungracefully
  process.exit(-1)
}

/** Configure the app server */
async function configure (config: WorkerConfiguration): Promise<void> {
  if (appServer?.listening) {
    throw new Error('Server already started')
  }

  configuration = config
  appServer = createApp(config)

  if (wormhole.connected) {
    await wormhole.event('configured')
  }
}

/** Start the app server */
async function start (): Promise<number> {
  if (appServer?.listening) {
    throw new Error('Server already started')
  }

  if (configuration.server && Object.keys(configuration.server).includes('port')) {
    await listenServer(appServer, configuration.server)
  } else {
    await listenServer(appServer)
  }

  const appPort = (<AddressInfo>appServer.address()).port

  // Update the process file with the app port
  await setProcess({
    pid: process.pid,
    appPort
  })

  if (wormhole.connected) {
    await wormhole.event('started', appPort)
  }

  return appPort
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
  if (apiServer.listening) {
    await closeServer(apiServer)
  }

  if (appServer?.listening) {
    await closeServer(appServer)
  }

  if (wormhole.connected) {
    await wormhole.event('disposed')
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
