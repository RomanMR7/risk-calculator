export function getRiskRewardQuality(riskReward) {
  if (!Number.isFinite(riskReward)) {
    return {
      label: "Недоступно",
      tone: "neutral",
    };
  }

  if (riskReward > 3) {
    return {
      label: "🟢 Отличное соотношение",
      tone: "excellent",
    };
  }

  if (riskReward >= 2 && riskReward <= 3) {
    return {
      label: "🟡 Хорошее соотношение",
      tone: "good",
    };
  }

  if (riskReward >= 1 && riskReward < 2) {
    return {
      label: "🟠 Среднее соотношение",
      tone: "average",
    };
  }

  return {
    label: "🔴 Слабое соотношение",
    tone: "weak",
  };
}
