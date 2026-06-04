export function buildTradePlan(input, result, _disclaimer, source = null) {
  const direction = String(input.direction || "").toUpperCase();
  const directionIcon = direction === "SHORT" ? "📉" : "📈";
  const lines = [
    "📌 План сделки",
    "",
    `${directionIcon} Направление: ${direction}`,
    `💰 Депозит: $${input.deposit}`,
    `🛡 Риск: ${input.riskPercent}% / $${result.riskAmount}`,
    "",
    `🎯 Вход: ${input.entryPrice}`,
    `⛔ Stop Loss: ${input.stopLossPrice}`,
    `✅ Take Profit: ${input.takeProfitPrice}`,
    "",
    `📊 Размер позиции: $${result.positionSizeUsd}`,
    `🪙 Количество актива: ${result.quantity}`,
    `💵 Потенциальная прибыль: $${result.potentialProfit}`,
    `⚖️ Risk / Reward: ${result.riskReward}`,
  ];

  if (source?.name && source?.url) {
    lines.push("", `Рассчитано в ${source.name}:`, source.url);
  }

  return lines.join("\n");
}
