'use strict'

import { promises } from 'fs'
import { InitConfiguration } from '../createWorker'

export default async function readConfig (path: string): Promise<InitConfiguration> {
  const text = await promises.readFile(path, 'utf-8')
  return JSON.parse(text)
}
