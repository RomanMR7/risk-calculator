import { calculatePosition, round } from "./calculator.js";

const form = document.querySelector("[data-form]");
const result = document.querySelector("[data-result]");
const error = document.querySelector("[data-error]");
const riskValue = document.querySelector("[data-risk-value]");
const stopDelta = document.querySelector("[data-stop-delta]");
const takeProfitDelta = document.querySelector("[data-take-profit-delta]");
const directionButtons = [...document.querySelectorAll("[data-direction]")];
const riskButtons = [...document.querySelectorAll("[data-risk-preset]")];

const fields = {
  deposit: document.querySelector("#deposit"),
  riskPercent: document.querySelector("#riskPercent"),
  direction: document.querySelector("#direction"),
  entryPrice: document.querySelector("#entryPrice"),
  stopLossPrice: document.querySelector("#stopLossPrice"),
  takeProfitPrice: document.querySelector("#takeProfitPrice"),
};

function formatNumber(value, digits = 4) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(round(value, digits));
}

function formatUsd(value, digits = 2) {
  return `$${formatNumber(value, digits)}`;
}

function formatPercent(value) {
  return `${formatNumber(value * 100, 2)}%`;
}

function readInput() {
  return {
    deposit: fields.deposit.value,
    riskPercent: fields.riskPercent.value,
    direction: fields.direction.value,
    entryPrice: fields.entryPrice.value,
    stopLossPrice: fields.stopLossPrice.value,
    takeProfitPrice: fields.takeProfitPrice.value,
  };
}

function setDirection(direction) {
  fields.direction.value = direction;
  directionButtons.forEach((button) => {
    const active = button.dataset.direction === direction;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  calculate();
}

function setRisk(value) {
  fields.riskPercent.value = value;
  updateRiskUi();
  calculate();
}

function updateRiskUi() {
  const value = Number(fields.riskPercent.value);
  riskValue.textContent = `${formatNumber(value, 1)}%`;
  riskButtons.forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.riskPreset) === value);
  });
}

function updateDistanceHints(data) {
  if (!data) {
    stopDelta.textContent = "";
    takeProfitDelta.textContent = "";
    return;
  }

  stopDelta.textContent = formatPercent(data.stopDistancePercent);
  takeProfitDelta.textContent = formatPercent(data.takeProfitDistancePercent);
}

function render(data) {
  const items = [
    ["Сумма риска", formatUsd(data.riskAmount)],
    ["Размер позиции", formatUsd(data.positionSizeUsd)],
    ["Количество актива", formatNumber(data.quantity, 8)],
    ["Потенциальная прибыль", formatUsd(data.potentialProfit)],
    ["Risk / Reward", formatNumber(data.riskReward, 2)],
    ["До Stop Loss", formatPercent(data.stopDistancePercent)],
    ["До Take Profit", formatPercent(data.takeProfitDistancePercent)],
  ];

  result.innerHTML = items.map(([label, value]) => `
    <article class="metric">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `).join("");
}

function calculate() {
  updateRiskUi();

  try {
    const data = calculatePosition(readInput());
    error.textContent = "";
    updateDistanceHints(data);
    render(data);
  } catch (event) {
    result.innerHTML = "";
    updateDistanceHints(null);
    error.textContent = event.message;
  }
}

directionButtons.forEach((button) => {
  button.addEventListener("click", () => setDirection(button.dataset.direction));
});

riskButtons.forEach((button) => {
  button.addEventListener("click", () => setRisk(button.dataset.riskPreset));
});

form.addEventListener("input", calculate);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  calculate();
});

setDirection("long");
