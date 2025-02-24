const { PeerRPCClient } = require('grenache-nodejs-http');
const Link = require('grenache-nodejs-link');

module.exports = (orderBook) => {
  const clientLink = new Link({
    grape: 'http://127.0.0.1:30001'
  })
  clientLink.start()

  const clientPeer = new PeerRPCClient(clientLink, {})
  orderBook.setClientPeer(clientPeer)
  clientPeer.init()

  return { clientPeer, clientLink }
}