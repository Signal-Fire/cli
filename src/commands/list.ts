'use strict'

import Table from 'cli-table3'
import prettyMilliseconds from 'pretty-ms'

import { readProcessFile } from '../lib/process'

export interface ListOptions {
  token: boolean,
  json: boolean
}

export default async function list ({ token, json }: ListOptions): Promise<void> {
  const list = await readProcessFile()
  const pids = Object.keys(list)

  if (json) {
    if (!token) {
      pids.forEach(pid => {
        delete list[pid].apiToken
      })
    }

    console.log(JSON.stringify(list))
    return
  }

  console.log('Listing all active workers\n')

  if (!pids.length) {
    console.log('There are no active workers')
    return
  }

  const head = [
    '#',
    'PID',
    'Created',
    'Uptime',
    'API Port',
    'App Port'
  ]

  if (token) {
    head.splice(4, 0, 'API Token')
  }

  const table = new Table({ head })

  let i = 0
  for (const pid of pids) {
    i++
    const info = list[pid]
    const createdOn = new Date(info.createdOn)
    const uptime = Date.now() - createdOn.getTime()

    const arr = [
      i,
      info.pid,
      createdOn.toLocaleString(),
      prettyMilliseconds(uptime),
      info.apiPort ?? '-',
      info.appPort ?? '-'
    ]

    if (token) {
      arr.splice(4, 0, info.apiToken ?? '-')
    }

    table.push(arr)
  }

  console.log(table.toString())
}
