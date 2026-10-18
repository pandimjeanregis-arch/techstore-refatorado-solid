class FreightCalculator {
  static REGION_RATES = {
    "sudeste": { base: 20, multiplier: 4 },
    "sul": { base: 28, multiplier: 5 },
    "centro-oeste": { base: 35, multiplier: 6 },
    "nordeste": { base: 45, multiplier: 7 },
    "norte": { base: 60, multiplier: 9 }
  };

  calculate(order, totalWeight) {
    if (order.couponCode === "FRETEGRATIS") {
      return 0;
    }

    const region = order.customer && order.customer.address ? order.customer.address.region : null;
    const rate = FreightCalculator.REGION_RATES[region] || { base: 50, multiplier: 8 };

    return rate.base + totalWeight * rate.multiplier;
  }
}

module.exports = FreightCalculator;