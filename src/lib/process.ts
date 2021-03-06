'use strict'

import { resolve } from 'path'
import { unlink } from 'fs/promises'
import { readJSON, writeJSON } from './util'

export interface ProcessInfo {
  pid: number,
  createdOn?: string,
  apiPort?: number,
  apiToken?: string,
  appPort?: number
}

export interface ProcessInfoList {
  [pid: string]: ProcessInfo
}

/** Path to the process file. */
const PROCESS_FILE = resolve(__dirname, '../../.processes')

/** Read the process file. */
export async function readProcessFile (): Promise<ProcessInfoList> {
  let processes: ProcessInfoList = {}

  try {
    processes = await readJSON(PROCESS_FILE)
  } catch (e) {
    // Only throw if it's NOT a not-found error
    if (e.code !== 'ENOENT') {
      throw e
    }
  }

  return processes
}

/** Write the process file. */
export async function writeProcessFile (list: ProcessInfoList): Promise<void> {
  if (!list || !Object.keys(list).length) {
    await unlink(PROCESS_FILE)
  } else {
    await writeJSON(PROCESS_FILE, list)
  }
}

/** Set process info. */
export async function setProcess (info: ProcessInfo, list?: ProcessInfoList): Promise<void> {
  list = list ?? await readProcessFile()
  list[info.pid] = {
    ...(list[info.pid] ?? {}),
    ...info
  }
  await writeProcessFile(list)
}

/** Delete process info */
export async function deleteProcess (pid: number, list?: ProcessInfoList): Promise<void> {
  list = list ?? await readProcessFile()

  if (list[pid]) {
    delete list[pid]
    await writeProcessFile(list)
  }
}
