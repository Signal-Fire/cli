'use strict'

import { Server } from 'http'
import Koa, { Middleware } from 'koa'
import Router from '@koa/router'
import createHttpError from 'http-errors'

export function checkToken (token: string): Middleware {
  return async function checkToken (ctx, next) {
    const tokenStr = ctx.headers['x-token'] ?? ctx.query['token']

    if (!tokenStr || tokenStr !== token) {
      throw createHttpError(401, 'Missing or invalid token')
    }

    return next()
  }
}

export default function createApi ({ token }: { token: string }): Server {
  const app = new Koa()
  const router = new Router()

  router.get('/resource-usage',
    checkToken(token),
    async function resourceUsage (ctx, next) {
      ctx.status = 200
      ctx.response.type = 'json'
      ctx.body = process.resourceUsage()
      return next()
    }
  )

  app.use(router.middleware())
  app.use(router.allowedMethods())

  return new Server(app.callback())
}
