'use strict'

import Table from 'cli-table3'
import prettyMilliseconds from 'pretty-ms'

import { readProcessFile } from '../lib/process'
import { isNumber } from '../lib/util'

export default async function info (pid: string, { token }: { token: boolean }): Promise<void> {
  if (!isNumber(pid)) {
    console.log('Expected PID to be a number')
    return
  }

  console.log(`Listing info for worker with PID ${pid}\n`)

  const list = await readProcessFile()

  if (!list[pid]) {
    console.log(`Worker with PID ${pid} not found`)
    return
  }

  const head = [
    'PID',
    'Created',
    'Uptime',
    'API Port',
    'App Port'
  ]

  if (token) {
    head.splice(3, 0, 'API Token')
  }

  const table = new Table({ head })
  const info = list[pid]
  const createdOn = new Date(info.createdOn)
  const uptime = Date.now() - createdOn.getTime()

  const arr = [
    info.pid,
    info.createdOn,
    prettyMilliseconds(uptime, { compact: true }),
    info.apiPort ?? '-',
    info.appPort ?? '-'
  ]

  if (token) {
    arr.splice(3, 0, info.apiToken)
  }

  table.push(arr)
  console.log(table.toString())
}
