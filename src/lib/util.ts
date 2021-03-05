'use strict'

import { Server } from 'http'
import { ListenOptions } from 'net'
import { resolve } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { ChildProcess, spawn } from 'child_process'

import Wormhole from '@art-of-coding/wormhole'

export interface WorkerConfiguration {
  registry: 'local' | {
    name: string,
    args?: any[]
  },
  server?: ListenOptions
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
export async function spawnWorker ({ detached }: { detached: boolean }): Promise<[ ChildProcess, Wormhole ]> {
  const workerPath = resolve(__dirname, '../worker.js')
  const worker = spawn('node', [ workerPath ], {
    stdio: [ 'ignore', 'ignore', 'ignore', 'ipc' ],
    detached
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
