import test from "node:test";
import assert from "node:assert/strict";
import { calculatePosition, round } from "../src/calculator.js";

test("calculates a LONG trade from the acceptance example", () => {
  const result = calculatePosition({
    deposit: 1000,
    riskPercent: 1,
    direction: "long",
    entryPrice: 100,
    stopLossPrice: 98,
    takeProfitPrice: 106,
  });

  assert.equal(result.riskAmount, 10);
  assert.equal(result.stopDistancePercent, 0.02);
  assert.equal(result.positionSizeUsd, 500);
  assert.equal(result.quantity, 5);
  assert.equal(round(result.takeProfitDistancePercent, 8), 0.06);
  assert.equal(round(result.potentialProfit, 8), 30);
  assert.equal(round(result.riskReward, 8), 3);
});

test("calculates a SHORT trade", () => {
  const result = calculatePosition({
    deposit: 2000,
    riskPercent: 2,
    direction: "short",
    entryPrice: 50,
    stopLossPrice: 55,
    takeProfitPrice: 35,
  });

  assert.equal(result.riskAmount, 40);
  assert.equal(result.stopDistancePercent, 0.1);
  assert.equal(result.positionSizeUsd, 400);
  assert.equal(result.quantity, 8);
  assert.equal(result.takeProfitDistancePercent, 0.3);
  assert.equal(result.potentialProfit, 120);
  assert.equal(result.riskReward, 3);
});

test("calculates risk amount", () => {
  const result = calculatePosition({
    deposit: 1500,
    riskPercent: 0.5,
    direction: "long",
    entryPrice: 10,
    stopLossPrice: 9,
    takeProfitPrice: 12,
  });

  assert.equal(result.riskAmount, 7.5);
});

test("calculates position size and quantity", () => {
  const result = calculatePosition({
    deposit: 1000,
    riskPercent: 1,
    direction: "long",
    entryPrice: 25,
    stopLossPrice: 24,
    takeProfitPrice: 28,
  });

  assert.equal(result.positionSizeUsd, 250);
  assert.equal(result.quantity, 10);
});

test("calculates potential profit and Risk / Reward", () => {
  const result = calculatePosition({
    deposit: 1000,
    riskPercent: 2,
    direction: "long",
    entryPrice: 100,
    stopLossPrice: 95,
    takeProfitPrice: 115,
  });

  assert.equal(result.potentialProfit, 60);
  assert.equal(result.riskReward, 3);
});

test("rejects Stop Loss equal to entry price", () => {
  assert.throws(() => calculatePosition({
    deposit: 1000,
    riskPercent: 1,
    direction: "long",
    entryPrice: 100,
    stopLossPrice: 100,
    takeProfitPrice: 110,
  }), /Цена входа не может быть равна Stop Loss/);
});

test("rejects invalid LONG Stop Loss", () => {
  assert.throws(() => calculatePosition({
    deposit: 1000,
    riskPercent: 1,
    direction: "long",
    entryPrice: 100,
    stopLossPrice: 101,
    takeProfitPrice: 110,
  }), /Для LONG Stop Loss должен быть ниже/);
});

test("rejects invalid SHORT Stop Loss", () => {
  assert.throws(() => calculatePosition({
    deposit: 1000,
    riskPercent: 1,
    direction: "short",
    entryPrice: 100,
    stopLossPrice: 99,
    takeProfitPrice: 90,
  }), /Для SHORT Stop Loss должен быть выше/);
});

test("rejects invalid LONG Take Profit", () => {
  assert.throws(() => calculatePosition({
    deposit: 1000,
    riskPercent: 1,
    direction: "long",
    entryPrice: 100,
    stopLossPrice: 98,
    takeProfitPrice: 99,
  }), /Для LONG Take Profit должен быть выше/);
});

test("rejects invalid SHORT Take Profit", () => {
  assert.throws(() => calculatePosition({
    deposit: 1000,
    riskPercent: 1,
    direction: "short",
    entryPrice: 100,
    stopLossPrice: 102,
    takeProfitPrice: 101,
  }), /Для SHORT Take Profit должен быть ниже/);
});

test("rejects zero and negative values", () => {
  assert.throws(() => calculatePosition({
    deposit: 0,
    riskPercent: 1,
    direction: "long",
    entryPrice: 100,
    stopLossPrice: 98,
    takeProfitPrice: 106,
  }), /Депозит: значение должно быть больше нуля/);
});
