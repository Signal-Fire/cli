'use strict'

import Table from 'cli-table3'

import { readProcessFile, processExists } from '../lib/process'

export default async function info (pid: string, { token }: { token: string }): Promise<void> {
  const processes = await readProcessFile()

  if (!processes[pid] || !processExists(parseInt(pid))) {
    console.log(`Worker with PID ${pid} not found`)
    return
  }

  const head = [ 'PID', 'Created', 'API Port', 'App Port' ]

  if (token) {
    head.splice(3, 0, 'API Token')
  }

  const table = new Table({
    head
  })

  const info = processes[pid]
    const arr = [
      info.pid,
      info.createdOn,
      info.apiPort ?? '-',
      info.appPort ?? '-'
    ]

    if (token) {
      arr.splice(3, 0, info.apiToken)
    }

    table.push(arr)

    console.log(`\nListing info for worker with PID ${pid}\n`)
    console.log(table.toString())
}
