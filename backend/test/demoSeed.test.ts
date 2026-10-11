import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/db.js'
import { seedDemoGraph } from '../src/topics/defaultGraph.js'
import { resetDatabase } from './helpers.js'

// The demo account shows six topics and five links (docs/role.md, spec 7).
describe('akun demo', () => {
  beforeEach(resetDatabase)

  it('punya 6 bulat dan 5 tautan', async () => {
    const user = await prisma.user.create({
      data: { name: 'Akun Demo', email: 'demo@contoh.id', passwordHash: 'tidak-dipakai' },
    })

    await prisma.$transaction((tx) => seedDemoGraph(tx, user.id))

    expect(await prisma.topic.count({ where: { userId: user.id } })).toBe(6)
    expect(await prisma.topicLink.count({ where: { userId: user.id } })).toBe(5)
  })
})
