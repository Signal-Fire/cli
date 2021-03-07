'use strict'

import { Server } from 'http'
import { Server as NetServer } from 'net'
import { resolve } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { ChildProcess, spawn } from 'child_process'

import Wormhole from '@art-of-coding/wormhole'

export interface WorkerConfiguration {
  registry?: string | {
    name: string,
    args?: any[]
  },
  api?: boolean | number | {
    host?: string,
    port: number,
    ipv6Only?: boolean
  },
  app?: number | {
    host?: string,
    port: number,
    ipv6Only?: boolean,
    pathname?: string
  },
  rtcConfig?: {
    bundlePolicy?: RTCBundlePolicy,
    iceCandidatePoolSize?: number,
    iceServers: RTCIceServer[],
    iceTransportPolicy: RTCIceTransportPolicy,
    rtcpMuxPolicy?: RTCRtcpMuxPolicy
  }
}

/** Read JSON from a file. */
export async function readJSON<T = any> (path: string): Promise<T> {
  const str = await readFile(path, 'utf-8')
  return JSON.parse(str)
}

/** Write JSON to a file. */
export async function writeJSON<T> (path: string, data: T): Promise<void> {
  const str = JSON.stringify(data)
  return writeFile(path, str, 'utf-8')
}

/** Server listen method encapsulated in a Promise. */
export function listenServer (server: Server, ...args: any[]) {
  return new Promise<void>(resolve => {
    args.push(resolve)
    server.listen(...args)
  })
}

/** Server close method encapsulated in a Promise. */
export async function closeServer (server: Server): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    server.close(err => {
      if (err) return reject(err)
      resolve()
    })
  })
}

export async function createWorker (config: WorkerConfiguration): Promise<[ ChildProcess, Wormhole ]> {
  const path = resolve(__dirname, '../worker.js')
  const worker = spawn('node', [ path ], {
    stdio: [ 'ignore', 'ignore', 'ignore', 'ipc' ],
    detached: true
  })

  const wormhole = new Wormhole(worker)

  // Wait for the worker's ready event
  await new Promise<void>((resolve, reject) => {
    function removeListeners (): void {
      worker.removeListener('error', onError)
      worker.removeListener('exit', onExit)
      wormhole.events.removeListener('ready', onReady)
    }

    function onReady (): void {
      removeListeners()
      resolve()
    }

    function onError (err: Error) {
      removeListeners()
      reject(err)
    }

    function onExit (exitCode: number) {
      removeListeners()
      reject(new Error(`Worker exited with code ${exitCode}`))
    }

    worker.on('error', onError)
    worker.on('exit', onExit)
    wormhole.events.on('ready', onReady)
  })

  // Configure the worker
  await wormhole.command('configure', config)

  return [ worker, wormhole ]
}

/** Check if the specified port is available */
export async function portAvailable (port: number): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    function removeListeners () {
      server.removeListener('error', onError)
      server.removeListener('listening', onListening)
    }

    function onError (err: any) {
      removeListeners()
      if (err.code === 'EADDRINUSE') {
        resolve(false)
      } else {
        reject(err)
      }
    }

    function onListening () {
      removeListeners()
      server.close()
      resolve(true)
    }

    const server = new NetServer()
    server.on('error', onError)
    server.on('listening', onListening)
    server.listen(port)
  })
}

/** Check if a string is a number */
export function isNumber (str: string) {
  return !isNaN(Number(str))
}
