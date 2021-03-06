'use strict'

import Table from 'cli-table3'

import { readProcessFile } from '../lib/process'

export default async function list ({ token }: { token: boolean }): Promise<void> {
  console.log('Listing all active workers\n')

  const list = await readProcessFile()
  const pids = Object.keys(list)

  if (!pids.length) {
    console.log('There are no active workers')
    return
  }

  const head = [
    '#',
    'PID',
    'Created',
    'API Port',
    'App Port'
  ]

  if (token) {
    head.splice(3, 0, 'API Token')
  }

  const table = new Table({ head })

  let i = 0
  for (const pid of pids) {
    i++
    const info = list[pid]
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
}
