export function buildTradePlan(input, result, disclaimer) {
  const direction = String(input.direction || "").toUpperCase();

  return [
    "План сделки",
    "",
    `Направление: ${direction}`,
    `Депозит: $${input.deposit}`,
    `Риск: ${input.riskPercent}% / $${result.riskAmount}`,
    `Цена входа: ${input.entryPrice}`,
    `Stop Loss: ${input.stopLossPrice}`,
    `Take Profit: ${input.takeProfitPrice}`,
    "",
    `Размер позиции: $${result.positionSizeUsd}`,
    `Количество актива: ${result.quantity}`,
    `Потенциальная прибыль: $${result.potentialProfit}`,
    `Risk / Reward: ${result.riskReward}`,
    "",
    disclaimer,
  ].join("\n");
}
