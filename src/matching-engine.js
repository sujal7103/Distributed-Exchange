const { OrderType, OrderAction } = require("./schema");

module.exports = async (orderBook) => {
  // Stay in sync with other service DB
  const sync = await orderBook.syncOrderBook()
  if (!sync.success) throw new Error(`\n🔴 ${orderBook.port} :: Unable to sync order book`)

  console.log(`\n🚨  ${orderBook.port} :: Order matcher is running...`)

  // Check the DB for potential matches every 2 seconds 
  setInterval(async () => {
    // Get the best buy order 
    let bestBuyOrder
    for (const id in orderBook.DB[OrderType.BUY]) {
      const buyOrder = orderBook.DB[OrderType.BUY][id]
      if (!bestBuyOrder || bestBuyOrder.price < buyOrder.price || buyOrder.isLocked)
        bestBuyOrder = buyOrder
    }
    // Get the best sell order 
    let bestSellOrder
    for (const id in orderBook.DB[OrderType.SELL]) {
      const sellOrder = orderBook.DB[OrderType.SELL][id]
      if (!bestSellOrder || bestSellOrder.price > sellOrder.price || sellOrder.isLocked)
        bestSellOrder = sellOrder
    }

    // Check if there is a potential match
    // Return if there is no buy order or sell order
    // Return if the best buy order is less than the best sell order
    if (!bestBuyOrder || !bestSellOrder) return
    if (bestBuyOrder.price < bestSellOrder.price) return

    console.log("\n\n ===================================================")
    console.log(`\n🚨 ${orderBook.port} :: Fund Order match  @ ${new Date().toISOString()}`)

    // Lock both Orders to prevent race conditions
    const lockSellOrder = await orderBook.sendMessage(OrderAction.LOCK_ORDER, bestSellOrder)
    const lockBuyorder = await orderBook.sendMessage(OrderAction.LOCK_ORDER, bestBuyOrder)

    // Verify that every exchange instance acknowledges the lock
    // If lockstatus is false, send an UNLOCK_ORDER
    let lockStatus = true
    for (let i = 0; i < lockSellOrder.length; i++) {
      lockStatus = lockSellOrder[i].success && lockBuyorder[i].success
      if (!lockStatus) {
        await orderBook.sendMessage(OrderAction.UNLOCK_ORDER, bestSellOrder)
        await orderBook.sendMessage(OrderAction.UNLOCK_ORDER, bestBuyOrder)
        break;
      }
    }

    console.log(`\n⚪️ ${orderBook.port} :: SELL ORDER ::`, bestSellOrder)
    console.log(`\n⚪️ ${orderBook.port} :: BUY ORDER ::`, bestBuyOrder)

    if (bestBuyOrder.qty != bestSellOrder.qty) {
      const buyIsgreater = bestBuyOrder.qty > bestSellOrder.qty
      const partialOrder = buyIsgreater ? bestBuyOrder : bestSellOrder;
      const fillOrder = buyIsgreater ? bestSellOrder : bestBuyOrder;
      orderBook.createPartialOrder(partialOrder, fillOrder)
      await orderBook.sendMessage(OrderAction.FILL_ORDER, fillOrder)
      await orderBook.sendMessage(OrderAction.PARTIAL_ORDER, partialOrder)
      await orderBook.sendMessage(OrderAction.UNLOCK_ORDER, partialOrder)
    } else {
      orderBook.deleteOrder({ data: bestBuyOrder })
      orderBook.deleteOrder({ data: bestSellOrder })
      await orderBook.sendMessage(OrderAction.FILL_ORDER, bestBuyOrder)
      await orderBook.sendMessage(OrderAction.FILL_ORDER, bestSellOrder)
    }

    console.log(`\n ------------------ ORDER EXECUTED -----------------\n`)

  }, 2000);
}