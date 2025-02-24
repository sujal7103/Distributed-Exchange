const { v4 } = require('uuid');

class Order {
  constructor({ price, qty, type }) {
    this.id = v4();
    this.price = price;
    this.qty = qty;
    this.type = type;
    this.status = OrderStatus.ACTIVE;
    this.isLocked = false;
    this.lockedBy = undefined
  }
}

const OrderType = {
  SELL: "sell",
  BUY: "buy"
}

const OrderStatus = {
  ACTIVE: "active",
  PARTIAL: "partial",
}

const OrderAction = {
  CREATE_ORDER: "create-order",
  GET_ORDERS: "get-orders",
  LOCK_ORDER: "lock-order",
  UNLOCK_ORDER: "unlock-order",
  FILL_ORDER: "fill-order",
  PARTIAL_ORDER: "partial-order",
  CANCEL_ORDER: "cancel-order",
  LOG_ORDER_BOOK: "log-order-book"
}

module.exports = {
  Order,
  OrderType,
  OrderStatus,
  OrderAction,
}