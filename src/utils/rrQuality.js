export function getRiskRewardQuality(riskReward) {
  if (!Number.isFinite(riskReward)) {
    return {
      label: "Недоступно",
      tone: "neutral",
    };
  }

  if (riskReward < 1) {
    return {
      label: "Слабое соотношение",
      tone: "weak",
    };
  }

  if (riskReward < 2) {
    return {
      label: "Умеренное соотношение",
      tone: "moderate",
    };
  }

  return {
    label: "Сильное соотношение",
    tone: "strong",
  };
}
