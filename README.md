# procbridge-nodejs

ProcBridge is a super-lightweight IPC (Inter-Process Communication) protocol over TCP socket. It enables you to **send and recieve JSON** between processes easily. ProcBridge is much like a simplified version of HTTP protocol, but only transfer JSON values.

Please note that this repo is the **Node.js implementation** of ProcBridge protocol. You can find detailed introduction of ProcBridge protocol in the main repository: [gongzhang/procbridge](https://github.com/gongzhang/procbridge).

# Installation

```
npm i procbridge
```

# Example

Server Side:

```javascript
const { Server } = require('procbridge')

const server = new Server('0.0.0.0', 8000, (method, payload) => {
  // define remote methods:
  switch (method) {
    case 'echo':
      return payload
    case 'sum':
      return payload.reduce((sum, next) => { return sum + next })
    case 'err':
      throw new Error('an server error')
  }
})

server.start()
```

Client Side:

```javascript
const { Client } = require('procbridge')
const client = new Client('127.0.0.1', 8000)

// call remote methods:
await client.request('echo', 123) // 123
await client.request('echo', ['a', 'b', 'c']) // ['a', 'b', 'c']
await client.request('sum', [1, 2, 3, 4]) // 10
```
