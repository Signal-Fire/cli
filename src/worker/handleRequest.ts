'use strict'

import { IncomingMessage, ServerResponse, STATUS_CODES } from 'http'
import { parse } from 'url'

export default function handleRequest (path?: string): (req: IncomingMessage, res: ServerResponse) => void {
  return function handleRequest (req: IncomingMessage, res: ServerResponse) {
    let status = path ? 404 : 426

    const message = STATUS_CODES[status]
    res.writeHead(status, message, {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(message),
      'Connection': 'close'
    })

    res.end(message)
  }
}
