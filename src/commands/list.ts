'use strict'

import Table from 'cli-table3'

import { readProcessFile, processExists, writeProcessFile } from '../lib/process'

export default async function list ({ token }: { token: boolean }): Promise<void> {
  console.log('\nLisiting active workers:\n')

  const processes = await readProcessFile()
  let updated = false

  if (!Object.keys(processes).length) {
    const table = new Table()
    table.push([ 'No active workers' ])
    console.log(table.toString())
    return
  }

  const head = [ '#', 'PID', 'Created', 'API Port', 'App Port' ]

  if (token) {
    head.splice(3, 0, 'API Token')
  }

  const table = new Table({
    head
  })

  let i = 0
  for (const pid of Object.keys(processes)) {
    if (!processExists(parseInt(pid))) {
      // Delete process from file
      delete processes[pid]
      updated = true
      continue
    }

    i++
    const info = processes[pid]
    const arr = [
      i,
      info.pid,
      info.createdOn,
      info.apiPort ?? '-',
      info.appPort ?? '-'
    ]

    if (token) {
      arr.splice(3, 0, info.apiToken)
    }

    table.push(arr)
  }

  console.log(table.toString())

  if (updated) {
    await writeProcessFile(processes)
  }
}
