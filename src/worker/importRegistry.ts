'use strict'

import { Registry } from '@lucets/registry'

export default async function importRegistry (name: string, args: any[]): Promise<Registry> {
  let Constructor = await import(name)

  if (Constructor.default) {
    Constructor = Constructor.default
  }

  return new Constructor(...args)
}
