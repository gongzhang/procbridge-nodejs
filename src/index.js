const net = require('net')
const protocol = require('./protocol')
const { ServerError } = require('./errors')
const { StatusCode } = require('./const')

class Client {
  constructor (host, port) {
    this.host = host
    this.port = port
  }

  async request (method, payload) {
    const client = new net.Socket()
    client.connect(this.port, this.host, () => {
      protocol.writeRequest(client, method, payload)
    })
    try {
      const { statusCode, payload, message } = await protocol.readResponse(client)
      if (statusCode === StatusCode.GOOD_RESPONSE) {
        return payload
      } else {
        throw new ServerError(message)
      }
    } finally {
      client.destroy()
    }
  }
}

class Server {
  constructor (host, port, delegate) {
    this.host = host
    this.port = port
    this.delegate = delegate
    this.server = null
  }

  start () {
    if (this.server !== null) {
      return
    }
    this.server = net.createServer(async socket => {
      const { method, payload } = await protocol.readRequest(socket)
      let ret
      try {
        ret = this.delegate(method, payload)
      } catch (err) {
        protocol.writeBadResponse(socket, err.message || err)
        socket.destroy()
        return
      }

      if (ret !== undefined && ret !== null && typeof ret.then === 'function') {
        ret.then(result => {
          protocol.writeGoodResponse(socket, result)
          socket.destroy()
        }).catch(err => {
          protocol.writeBadResponse(socket, err.message || err)
          socket.destroy()
        })
      } else {
        protocol.writeGoodResponse(socket, ret)
        socket.destroy()
      }
    })

    try {
      this.server.listen(this.port, this.host)
    } catch (err) {
      this.server = null
      throw err
    }
  }

  stop () {
    if (this.server === null) {
      return
    }
    this.server.close()
    this.server = null
  }
}

module.exports = {
  Client, Server, ServerError
}
