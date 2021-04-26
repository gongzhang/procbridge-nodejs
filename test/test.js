const assert = require('assert')
const should = require('should')
const fs = require('fs')
const { Server, Client } = require('../src/index')

const server = new Server('0.0.0.0', 8000, (method, payload) => {
  switch (method) {
    case 'echo':
      return payload
    case 'sum':
      return payload.reduce((sum, next) => { return sum + next })
    case 'err':
      throw new Error('generated error')
    case 'sleep':
      return new Promise(resolve => setTimeout(resolve, payload))
    default:
      return null
  }
})

let client

before(() => server.start())
after(() => server.stop())
beforeEach(() => { client = new Client('127.0.0.1', 8000) })
afterEach(() => { client = null })

describe('procbridge', () => {
  it('none', async () => {
    const reply = await client.request()
    should(reply).be.exactly(null)
    await client.request('echo')
    should(reply).be.exactly(null)
    await client.request(null, 'hello')
    should(reply).be.exactly(null)
  })

  it('echo', async () => {
    let reply = await client.request('echo', 123)
    should(reply).be.exactly(123)
    reply = await client.request('echo', 3.14)
    should(reply).be.exactly(3.14)
    reply = await client.request('echo', 'hello')
    should(reply).be.exactly('hello')
    reply = await client.request('echo', ['a', 'b'])
    should(reply).be.eql(['a', 'b'])
    reply = await client.request('echo', { key: 'value' })
    should(reply).be.eql({ key: 'value' })
    reply = await client.request('echo', { key: 'e😄э' })
    should(reply).be.eql({ key: 'e😄э' })
  })

  it('sum', async () => {
    const reply = await client.request('sum', [1, 2, 3, 4])
    should(reply).be.exactly(10)
  })

  it('err', async () => {
    try {
      await client.request('err')
      assert.fail('expect server error')
    } catch (err) {
      if (err.name !== 'ServerError') {
        assert.fail('expect server error')
      }
    }
  })

  it('bigPayload', async () => {
    const txt = fs.readFileSync('./test/article.txt', { encoding: 'utf8' })
    const reply = await client.request('echo', txt)
    should(reply).be.exactly(txt)
  })
})
