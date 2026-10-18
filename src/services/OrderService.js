const ProductRepository = require("../repositories/ProductRepository");
const OrderRepository = require("../repositories/OrderRepository");
const Logger = require("../utils/Logger");
const DiscountCalculator = require("./DiscountCalculator");
const FreightCalculator = require("./FreightCalculator");
const PaymentProcessor = require("./PaymentProcessor");
const OrderValidator = require("./OrderValidator");

let NotificationService;
try {
  NotificationService = require("./NotificationService");
} catch {
  NotificationService = require("../services/NotificationService");
}

class OrderService {
  constructor(
    productRepository = new ProductRepository(),
    orderRepository = new OrderRepository(),
    notificationService = new NotificationService(),
    logger = new Logger(),
    discountCalculator = new DiscountCalculator(),
    freightCalculator = new FreightCalculator(),
    paymentProcessor = new PaymentProcessor(),
    validator = null
  ) {
    this.productRepository = productRepository;
    this.orderRepository = orderRepository;
    this.notificationService = notificationService;
    this.logger = logger;
    this.discountCalculator = discountCalculator;
    this.freightCalculator = freightCalculator;
    this.paymentProcessor = paymentProcessor;
    this.validator = validator || new OrderValidator(this.productRepository);
  }

  process(order) {
    this.logger.info(`Iniciando processamento do pedido ${order.id}.`);

    this.validator.validate(order);

    const subtotal = order.calculateSubtotal ? order.calculateSubtotal() : this._calculateSubtotal(order);
    const totalWeight = order.calculateTotalWeight ? order.calculateTotalWeight() : this._calculateTotalWeight(order);

    const discount = this.discountCalculator.calculate(order, subtotal);
    const freight = this.freightCalculator.calculate(order, totalWeight);
    const { paymentFee, paymentStatus } = this.paymentProcessor.process(
      order.paymentMethod,
      order.installments,
      subtotal
    );

    const total = Number((subtotal - discount + freight + paymentFee).toFixed(2));

    if (total <= 0) {
      throw new Error("Total do pedido invalido.");
    }

    for (const item of order.items) {
      this.productRepository.updateStock(item.product.id, item.quantity);
    }

    order.status = paymentStatus === "approved" ? "confirmed" : "waiting_payment";

    const orderSummary = {
      id: order.id,
      customerName: order.getCustomerName ? order.getCustomerName() : order.customer.name,
      customerEmail: order.getCustomerEmail ? order.getCustomerEmail() : order.customer.email,
      city: order.getCustomerCity ? order.getCustomerCity() : order.customer.address.city,
      state: order.getCustomerState ? order.getCustomerState() : order.customer.address.state,
      items: order.items.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        subtotal: item.getSubtotal ? item.getSubtotal() : item.product.price * item.quantity
      })),
      subtotal,
      discount: Number(discount.toFixed(2)),
      freight: Number(freight.toFixed(2)),
      paymentFee: Number(paymentFee.toFixed(2)),
      total,
      paymentMethod: order.paymentMethod,
      status: order.status,
      createdAt: order.createdAt
    };

    this.orderRepository.save(orderSummary);

    if (order.status === "confirmed") {
      this.notificationService.sendOrderConfirmation(order.customer, order.id, total);
    } else {
      this.logger.warn(`Pedido ${order.id} aguardando pagamento.`);
    }

    this._printSummary(orderSummary, order);

    return orderSummary;
  }

  _calculateSubtotal(order) {
    return order.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }

  _calculateTotalWeight(order) {
    return order.items.reduce((sum, item) => sum + item.product.weight * item.quantity, 0);
  }

  _printSummary(summary, order) {
    console.log("Resumo do pedido");
    console.log(`Cliente: ${summary.customerName}`);
    console.log(`Cidade: ${summary.city}/${summary.state}`);
    console.log(`Itens: ${order.getTotalItems ? order.getTotalItems() : summary.items.length}`);
    console.log(`Subtotal: R$ ${summary.subtotal.toFixed(2)}`);
    console.log(`Desconto: R$ ${summary.discount.toFixed(2)}`);
    console.log(`Frete: R$ ${summary.freight.toFixed(2)}`);
    console.log(`Taxas: R$ ${summary.paymentFee.toFixed(2)}`);
    console.log(`Total: R$ ${summary.total.toFixed(2)}`);
  }
}

module.exports = OrderService;
