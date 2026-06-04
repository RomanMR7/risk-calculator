const DIRECTIONS = new Set(["long", "short"]);

export function toNumber(value, field) {
  const number = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`${field}: нужно ввести число`);
  }
  return number;
}

function assertPositive(value, field) {
  if (value <= 0) {
    throw new Error(`${field}: значение должно быть больше нуля`);
  }
}

function normalizeInputs(input) {
  const deposit = toNumber(input.deposit, "Депозит");
  const riskPercent = toNumber(input.riskPercent, "Риск на сделку");
  const entryPrice = toNumber(input.entryPrice, "Цена входа");
  const stopLossPrice = toNumber(input.stopLossPrice, "Stop Loss");
  const takeProfitPrice = toNumber(input.takeProfitPrice, "Take Profit");
  const direction = String(input.direction || "").toLowerCase();

  assertPositive(deposit, "Депозит");
  assertPositive(riskPercent, "Риск на сделку");
  assertPositive(entryPrice, "Цена входа");
  assertPositive(stopLossPrice, "Stop Loss");
  assertPositive(takeProfitPrice, "Take Profit");

  if (!DIRECTIONS.has(direction)) {
    throw new Error("Направление: выберите LONG или SHORT");
  }

  if (entryPrice === stopLossPrice) {
    throw new Error("Цена входа не может быть равна Stop Loss.");
  }

  if (direction === "long" && stopLossPrice >= entryPrice) {
    throw new Error("Для LONG Stop Loss должен быть ниже цены входа.");
  }

  if (direction === "long" && takeProfitPrice <= entryPrice) {
    throw new Error("Для LONG Take Profit должен быть выше цены входа.");
  }

  if (direction === "short" && stopLossPrice <= entryPrice) {
    throw new Error("Для SHORT Stop Loss должен быть выше цены входа.");
  }

  if (direction === "short" && takeProfitPrice >= entryPrice) {
    throw new Error("Для SHORT Take Profit должен быть ниже цены входа.");
  }

  return { deposit, riskPercent, direction, entryPrice, stopLossPrice, takeProfitPrice };
}

export function calculatePosition(input) {
  const data = normalizeInputs(input);
  const riskAmount = data.deposit * data.riskPercent / 100;
  const stopDistancePercent = Math.abs(data.entryPrice - data.stopLossPrice) / data.entryPrice;
  const positionSizeUsd = riskAmount / stopDistancePercent;
  const quantity = positionSizeUsd / data.entryPrice;
  const takeProfitDistancePercent = Math.abs(data.takeProfitPrice - data.entryPrice) / data.entryPrice;
  const potentialProfit = positionSizeUsd * takeProfitDistancePercent;
  const riskReward = potentialProfit / riskAmount;

  const result = {
    ...data,
    riskAmount,
    stopDistancePercent,
    positionSizeUsd,
    quantity,
    takeProfitDistancePercent,
    potentialProfit,
    riskReward,
  };

  for (const key of Object.keys(result)) {
    const value = result[key];
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new Error(`Расчёт ${key} дал некорректное значение`);
    }
  }

  return result;
}

export function round(value, digits = 8) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
