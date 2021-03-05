'use strict'

import { readProcessFile, processExists, writeProcessFile } from '../lib/process'

export default async function stop (pid: string): Promise<void> {
  const list = await readProcessFile()

  if (!list[pid] || !processExists(parseInt(pid))) {
    console.log(`Worker with PID ${pid} not found`)
    return
  }

  try {
    process.kill(parseInt(pid), 'SIGTERM')
  } catch (e) {
    console.log('Unable to stop worker')
    console.error(e)
    return
  }

  delete list[pid]
  await writeProcessFile(list)

  console.log(`Worker with PID ${pid} stopped`)
}
