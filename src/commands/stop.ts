'use strict'

import { readProcessFile, writeProcessFile, ProcessInfoList } from '../lib/process'
import { isNumber } from '../lib/util'

function kill (pid: number, list: ProcessInfoList): void {
  if (!list[pid]) {
    throw new Error(`Worker with PID ${pid} not found`)
  }

  delete list[pid]

  try {
    process.kill(pid, 'SIGTERM')
  } catch (e) {
    throw new Error(`Worker with PID ${pid} not found`)
  }
}

export default async function stop (pid: string): Promise<void> {
  if (pid !== 'all' && !isNumber(pid)) {
    console.log('Expected PID to be \'all\' or a number')
    return
  }

  const list = await readProcessFile()
  const pids = Object.keys(list)

  console.log('Stopping all active workers\n')

  if (!pids.length) {
    console.log('There are no active workers')
    return
  }

  if (pid === 'all') {
    let i = 0
    for (const wid of pids) {
      i++
      try {
        kill(parseInt(wid), list)
        console.log(`${i}. Worker with PID ${wid} stopped`)
      } catch (e) {
        console.log(`${i}. Worker with PID ${wid} not found`)
      }
    }

    await writeProcessFile(list)

    console.log('\nAll workers have been stopped')
    return
  }

  try {
    kill(parseInt(pid), list)
    await writeProcessFile(list)

    console.log(`Worker with PID ${pid} stopped`)
  } catch (e) {
    console.log(e.message)
  }
}
