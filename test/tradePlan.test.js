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
    {
      name: "Risk Calculator",
      url: "https://risk-calculator-one.vercel.app/",
    },
  );

  assert.match(plan, /Направление: LONG/);
  assert.match(plan, /Риск: 1% \/ \$10/);
  assert.match(plan, /Размер позиции: \$500/);
  assert.match(plan, /Risk \/ Reward: 3/);
  assert.match(plan, /Рассчитано в Risk Calculator:/);
  assert.match(plan, /https:\/\/risk-calculator-one\.vercel\.app\//);
  assert.doesNotMatch(plan.toLowerCase(), /покупать|входить|гарант/);
});

test("formats a trade plan without source link when source is incomplete", () => {
  const plan = buildTradePlan(
    {
      direction: "short",
      deposit: "500",
      riskPercent: "2",
      entryPrice: "50",
      stopLossPrice: "55",
      takeProfitPrice: "35",
    },
    {
      riskAmount: "10",
      positionSizeUsd: "100",
      quantity: "2",
      potentialProfit: "30",
      riskReward: "3",
    },
    "Не является финансовой рекомендацией.",
  );

  assert.match(plan, /Направление: SHORT/);
  assert.doesNotMatch(plan, /Рассчитано в/);
});

test("labels weak Risk / Reward", () => {
  assert.deepEqual(getRiskRewardQuality(0.8), {
    label: "🔴 Слабое соотношение",
    tone: "weak",
  });
});

test("labels average Risk / Reward", () => {
  assert.deepEqual(getRiskRewardQuality(1), {
    label: "🟠 Среднее соотношение",
    tone: "average",
  });

  assert.deepEqual(getRiskRewardQuality(1.5), {
    label: "🟠 Среднее соотношение",
    tone: "average",
  });
});

test("labels good Risk / Reward", () => {
  assert.deepEqual(getRiskRewardQuality(2), {
    label: "🟡 Хорошее соотношение",
    tone: "good",
  });

  assert.deepEqual(getRiskRewardQuality(3), {
    label: "🟡 Хорошее соотношение",
    tone: "good",
  });
});

test("labels excellent Risk / Reward", () => {
  assert.deepEqual(getRiskRewardQuality(3.1), {
    label: "🟢 Отличное соотношение",
    tone: "excellent",
  });
});
