class PaymentProcessor {
  process(paymentMethod, installments, subtotal) {
    let paymentFee = 0;
    let paymentStatus = "pending";

    if (paymentMethod === "pix") {
      paymentStatus = "approved";
    } else if (paymentMethod === "credit_card") {
      if (installments > 1) {
        paymentFee = subtotal * 0.025;
      }
      paymentStatus = "approved";
    } else if (paymentMethod === "boleto") {
      paymentStatus = "waiting_payment";
    } else {
      throw new Error("Forma de pagamento invalida.");
    }

    return { paymentFee, paymentStatus };
  }
}

module.exports = PaymentProcessor;