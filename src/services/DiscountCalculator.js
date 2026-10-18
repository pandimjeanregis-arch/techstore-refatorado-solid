class DiscountCalculator {
  calculate(order, subtotal) {
    let discount = 0;

    if (order.customer && order.customer.type === "vip") {
      discount += subtotal * 0.08;
    } else if (order.customer && order.customer.type === "employee") {
      discount += subtotal * 0.15;
    }

    if (order.couponCode === "TECH10") {
      discount += subtotal * 0.1;
    }

    if (subtotal > 8000) {
      discount += 250;
    }

    if (order.paymentMethod === "pix") {
      discount += subtotal * 0.03;
    }

    return discount;
  }
}

module.exports = DiscountCalculator;