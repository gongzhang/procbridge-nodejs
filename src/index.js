const net = require('net')
const protocol = require('./protocol')
const { ServerError } = require('./errors')
const { StatusCode } = require('./const')


class Client {
  
  constructor(host, port) {
    this.host = host
    this.port = port
  }
  
  async request(method, payload) {
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

