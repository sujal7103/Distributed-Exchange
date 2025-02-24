const { PeerRPCServer } = require('grenache-nodejs-http');
const Link = require('grenache-nodejs-link');

module.exports = (orderBook) => {
  const serverLink = new Link({
    grape: 'http://127.0.0.1:30001'
  })
  serverLink.start()

  const serverPeer = new PeerRPCServer(serverLink, { timeout: 300000 })
  orderBook.setServerPeer(serverPeer)
  serverPeer.init()

  const service = serverPeer.transport('server')
  service.listen(orderBook.port)
  console.log(`\n⚪️ ${orderBook.port} :: ORDER-BOOK service is running...`)

  setInterval(function () {
    serverLink.announce("exchange", service.port, {})
  }, 1000)

  service.on('request', async (rid, key, payload, handler) => {
    if (payload.from !== orderBook.port) console.log(`\n🟠 ${orderBook.port} :: INCOMING ${payload.action.toUpperCase()} from ${payload.from}${payload && payload.data && payload.data.id ? " for " + payload.data.id.slice(0, 8) : ""}`)
    await orderBook.requestHandler(payload, handler.reply)
  })

  return { serverLink, serverPeer }
}