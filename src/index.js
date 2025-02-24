const OrderBook = require("./order-book");
const port = 1024 + Math.floor(Math.random() * 1000)
const orderBook = new OrderBook({ port })

// Start Server Peer
const { serverLink, serverPeer } = require("./server-peer")(orderBook)

// Start Client Peer
const { clientLink, clientPeer } = require("./client-peer")(orderBook)

// Start API Http Server
require("./api-server")(orderBook)

// Start Order Matching Engine
setTimeout(() => {
  require("./matching-engine")(orderBook)
}, 1000);

// Handle uncaughtException
process.on("uncaughtException", err => {
  console.error(`\n🔴 ${port} ::  Closing exchange instance... \n${err}`);
  clientLink.stop();
  process.exit(1)
});