'use strict'

import { fork } from 'child_process'
import Wormhole from '@art-of-coding/wormhole'

export interface InitConfiguration {
  registry: 'local' | {
    name: string,
    args: any[]
  },
  server?: {
    path?: string
  },
  rtc?: RTCConfiguration
}

export default async function createWorker () {
  const worker = fork('./dist/worker/worker.js')
  const wormhole = new Wormhole(worker)

  return new Promise<Wormhole>((resolve, reject) => {
    function removeListeners () {
      worker.removeListener('error', onReject)
      worker.removeListener('exit', onReject)
      wormhole.events.removeListener('ready', onResolve)
    }

    function onResolve () {
      removeListeners()
      resolve(wormhole)
    }

    function onReject (err?: Error) {
      removeListeners()
      reject(err)
    }

    worker.on('error', onReject)
    worker.on('exit', onReject)
    wormhole.events.on('ready', onResolve)
  })
}
