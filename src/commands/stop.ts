'use strict'

import { readProcessFile, processExists, writeProcessFile, ProcessInfoList } from '../lib/process'

function deletePid (pid: number, list: ProcessInfoList): void {
  if (!list[pid]) {
    throw new Error(`Worker with PID ${pid} not found`)
  }

  delete list[pid]

  if (!processExists(pid)) {
    throw new Error(`Worker with PID ${pid} not found`)
  }

  try {
    process.kill(pid, 'SIGTERM')
  } catch (e) {
    throw new Error('Unable to stop worker')
  }
}

function isInteger (str: string) {
  try {
    parseInt(str)
    return true
  } catch(e) {
    return false
  }
}

export default async function stop (pid: string): Promise<void> {
  if (pid !== 'all' && !isInteger(pid)) {
    console.log('Expected PID to be \'all\' or an integer')
    return
  }

  const list = await readProcessFile()
  const pids = Object.keys(list)

  if (!pids.length) {
    console.log('There are no active workers')
    return
  }

  if (pid === 'all') {
    console.log(`Stopping all ${pids.length} workers...\n`)

    let i = 0
    for (const wid of pids) {
      i++
      deletePid(parseInt(wid), list)
      console.log(`${i}. Worker with PID ${wid} stopped`)
    }

    await writeProcessFile(list)

    console.log('\nAll workers have been stopped')
    return
  }

  try {
    deletePid(parseInt(pid), list)
    await writeProcessFile(list)

    console.log(`Worker with PID ${pid} stopped`)
  } catch (e) {
    console.log(e.message)
  }
}
