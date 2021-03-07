'use strict'

import { Server } from 'http'
import Koa, { Middleware } from 'koa'
import Router from '@koa/router'
import createHttpError from 'http-errors'
import { WorkerConfiguration } from './util'

export interface CreateApiOptions {
  token: string,
  config: WorkerConfiguration
}

export function checkToken (token: string): Middleware {
  return async function checkToken (ctx, next) {
    const tokenStr = ctx.headers['x-token'] ?? ctx.query['token']

    if (!tokenStr || tokenStr !== token) {
      throw createHttpError(401, 'Missing or invalid token')
    }

    return next()
  }
}

export default function createApi ({ token, config }: CreateApiOptions): Server {
  const app = new Koa()
  const router = new Router()

  router.get('/configuration',
    checkToken(token),
    async function configuration (ctx) {
      ctx.status = 200
      ctx.response.type = 'json'
      ctx.body = config
    }
  )

  router.get('/resource-usage',
    checkToken(token),
    async function resourceUsage (ctx) {
      ctx.status = 200
      ctx.response.type = 'json'
      ctx.body = process.resourceUsage()
    }
  )

  router.get('/cpu-usage',
    checkToken(token),
    async function cpuUsage (ctx) {
      ctx.status = 200
      ctx.response.type = 'json'
      ctx.body = process.cpuUsage()
    }
  )

  router.get('/memory-usage',
    checkToken(token),
    async function memoryUsage (ctx) {
      ctx.status = 200
      ctx.response.type = 'json'
      ctx.body = process.memoryUsage()
    }
  )

  router.get('/uptime',
    checkToken(token),
    async function uptiem (ctx) {
      ctx.status = 200
      ctx.response.type = 'json'
      ctx.body = { uptime: process.uptime() }
    }
  )

  app.use(router.middleware())
  app.use(router.allowedMethods())

  return new Server(app.callback())
}
