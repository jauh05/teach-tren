import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'

// Database client for the end-to-end fixtures. The caller passes the test database URL, which must end with _test.
export function createE2eDatabase(url: string): PrismaClient {
  if (!/_test(\?|$)/.test(url)) {
    throw new Error('Fixture e2e hanya boleh memakai database yang namanya berakhiran _test.')
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })
}
