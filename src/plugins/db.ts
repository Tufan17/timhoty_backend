// src/plugins/db.ts
import fp from 'fastify-plugin'
import knex, { Knex } from 'knex'
import knexConfig from '../../knexfile'

declare module 'fastify' {
  interface FastifyInstance {
    knex: Knex
  }
}

export default fp(async (fastify, opts) => {
  const db = knex(knexConfig.development)
  fastify.decorate('knex', db)

  fastify.addHook('onClose', async (instance) => {
    await instance.knex.destroy()
  })
})
