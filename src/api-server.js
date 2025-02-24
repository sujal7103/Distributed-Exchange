require("express-async-errors")
const express = require('express')
const { Order, OrderAction } = require('./schema')
const app = express()
const port = 1024 + Math.floor(Math.random() * 1000)

class AppError extends Error { }

module.exports = (orderBook) => {
  app.use(express.json());
  app.use((req, res, next) => {
    console.log(`\n🔵 ${port} :: ${req.method.toUpperCase()} ${req.originalUrl}`)
    next();
  });

  app.get('/order-book', (req, res) => {
    const result = orderBook.getOrderBook({ from: orderBook.port })
    if (!result.success) throw new AppError("Error getting orders")
    res.status(200).send({ success: true, data: result })
  })

  app.get('/order-book/:order_type/:order_id', (req, res) => {
    const result = orderBook.getOrder({ type: req.params.order_type, id: req.params.order_id })
    if (!result.success) throw new AppError("Error getting order")
    res.status(200).send({ success: true, data: result })
  })

  app.post('/order-book', async (req, res) => {
    const result = await orderBook.createOrder(new Order({ price: req.body.price, qty: req.body.qty, type: req.body.type }))
    if (!result.success) throw new AppError("Error creating the order")
    res.status(200).send({ success: true, data: result.data })
  })

  app.post('/order-book/cancel', async (req, res) => {
    const result = await orderBook.cancelOrder(
      {
        from: orderBook.port,
        data: { id: req.body.id, type: req.body.type },
        action: OrderAction.CANCEL_ORDER
      },
      () => { },
      true
    )

    if (!result.success) throw new AppError("Error canceling the order")
    res.status(200).send({ success: true })
  })

  app.post('/order-book/log', async (req, res) => {
    const result = await orderBook.logOrderBook({}, () => { }, true)
    if (!result.success) throw new AppError("Error canceling the order")
    res.status(200).send({ success: true })
  })

  app.use("*", (req, res) => {
    res.status(404).send({ success: false, message: "Invalid route" })
  });

  app.use((error, req, res, next) => {
    console.log(`\n🔴 ${port} :: ${error}`)
    if (error.name == "AppError") {
      res.status(400).send({ success: false, message: error.message })
    }
    else {
      res.status(500).send({ success: false, message: error.message })
    }
  });

  app.listen(port, () => {
    console.log(`\n🔵 ${port} :: API service is running...`)
  })
} 