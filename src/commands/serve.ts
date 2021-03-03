'use strict'

import createWorker, { InitConfiguration } from "../createWorker"
import readConfig from "../lib/readConfig"

export interface ServeOptions {
  config?: string,
  port?: string,
  path?: string,
  detach: boolean
}

async function createConfiguration (options: ServeOptions): Promise<InitConfiguration> {
  let configuration: InitConfiguration

  // Check if a config file is used
  if (options.config) {
    try {
      configuration = await readConfig(options.config)
    } catch (e) {
      console.log('[error]: Unable to read or parse configuration file')
    }

    return
  }

  configuration = {
    registry: 'local'
  }

  if (options.path) {
    configuration.server = {
      path: options.path
    }
  }

  return configuration
}

export default async function serve (options: ServeOptions) {
  const configuration = await createConfiguration(options)
  const worker = await createWorker()

  console.log('- Worker created')

  await worker.command('init', configuration)

  console.log('- Worker initialized')

  await worker.command('start', parseInt(options.port ?? '3003'))

  console.log(`- Server running on port ${options.port ?? 3003}`)

  if (options.detach) {
    worker.disconnect()
    console.log('- Detached from process')
    return
  }
}
