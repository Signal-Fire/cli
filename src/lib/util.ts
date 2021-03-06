'use strict'

import { Server } from 'http'
import { Server as NetServer } from 'net'
import { resolve } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { ChildProcess, spawn } from 'child_process'

import Wormhole from '@art-of-coding/wormhole'

export interface WorkerConfiguration {
  registry: 'local' | {
    name: string,
    args?: any[]
  },
  server?: {
    host?: string,
    port?: number,
    ipv6Only?: boolean,
    pathname?: string
  },
  rtcConfig?: {
    iceCandidatePoolSize?: number,
    iceServers: RTCIceServer[],
    iceTransportPolicy: RTCIceTransportPolicy
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

/** Spawn a new worker */
export async function spawnWorker (): Promise<[ ChildProcess, Wormhole ]> {
  const workerPath = resolve(__dirname, '../worker.js')
  const worker = spawn('node', [ workerPath ], {
    stdio: [ 'ignore', 'ignore', 'ignore', 'ipc' ],
    detached: true
  })
  const wormhole = new Wormhole(worker)

  return new Promise<[ ChildProcess, Wormhole ]>((resolve, reject) => {
    function removeListeners (): void {
      worker.removeListener('error', onError)
      worker.removeListener('exit', onError)
      wormhole.events.removeListener('ready', onReady)
    }

    function onReady (): void {
      removeListeners()
      resolve([ worker, wormhole ])
    }

    function onError (err?: Error) {
      removeListeners()
      reject(err ?? new Error('Unknown error'))
    }

    worker.on('error', onError)
    worker.on('exit', onError)
    wormhole.events.on('ready', onReady)
  })
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
