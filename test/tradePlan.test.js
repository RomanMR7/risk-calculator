import test from "node:test";
import assert from "node:assert/strict";
import { buildTradePlan } from "../src/utils/tradePlan.js";
import { getRiskRewardQuality } from "../src/utils/rrQuality.js";

test("formats a trade plan without trading promises", () => {
  const plan = buildTradePlan(
    {
      direction: "long",
      deposit: "1000",
      riskPercent: "1",
      entryPrice: "100",
      stopLossPrice: "98",
      takeProfitPrice: "106",
    },
    {
      riskAmount: "10",
      positionSizeUsd: "500",
      quantity: "5",
      potentialProfit: "30",
      riskReward: "3",
    },
    "Не является финансовой рекомендацией.",
  );

  assert.match(plan, /Направление: LONG/);
  assert.match(plan, /Риск: 1% \/ \$10/);
  assert.match(plan, /Размер позиции: \$500/);
  assert.match(plan, /Risk \/ Reward: 3/);
  assert.doesNotMatch(plan.toLowerCase(), /покупать|входить|гарант/);
});

test("labels weak Risk / Reward", () => {
  assert.deepEqual(getRiskRewardQuality(0.9), {
    label: "Слабое соотношение",
    tone: "weak",
  });
});

test("labels moderate Risk / Reward", () => {
  assert.deepEqual(getRiskRewardQuality(1.5), {
    label: "Умеренное соотношение",
    tone: "moderate",
  });
});

test("labels strong Risk / Reward", () => {
  assert.deepEqual(getRiskRewardQuality(2), {
    label: "Сильное соотношение",
    tone: "strong",
  });
});
