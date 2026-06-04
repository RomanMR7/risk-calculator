import { calculatePosition, round } from "./calculator.js";
import { brandConfig } from "./config/brand.js";
import { educationCards } from "./content/education.js";

const form = document.querySelector("[data-form]");
const result = document.querySelector("[data-result]");
const error = document.querySelector("[data-error]");
const brandTagline = document.querySelector("[data-brand-tagline]");
const telegramLink = document.querySelector("[data-telegram-link]");
const educationToggle = document.querySelector("[data-education-toggle]");
const educationPanel = document.querySelector("[data-education-panel]");
const educationList = document.querySelector("[data-education-list]");
const disclaimer = document.querySelector("[data-disclaimer]");
const shareButton = document.querySelector("[data-share-button]");
const shareStatus = document.querySelector("[data-share-status]");
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

function initBrand() {
  document.title = brandConfig.name;
  brandTagline.textContent = brandConfig.tagline;
  telegramLink.href = brandConfig.telegramUrl;
  telegramLink.textContent = brandConfig.primaryCtaText;
  educationToggle.textContent = brandConfig.educationalCtaText;
  disclaimer.textContent = brandConfig.disclaimer;
}

function initEducation() {
  educationList.innerHTML = educationCards.map((card) => `
    <article class="education-item">
      <h3>${card.title}</h3>
      <p>${card.body}</p>
    </article>
  `).join("");
}

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

async function shareCalculator() {
  const shareData = {
    title: brandConfig.name,
    text: brandConfig.shareText,
    url: window.location.href.split("#")[0],
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      shareStatus.textContent = "Ссылка отправлена";
      return;
    }

    await navigator.clipboard.writeText(shareData.url);
    shareStatus.textContent = "Ссылка скопирована";
  } catch {
    shareStatus.textContent = "Не удалось скопировать ссылку";
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

educationToggle.addEventListener("click", () => {
  const isHidden = educationPanel.hidden;
  educationPanel.hidden = !isHidden;
  educationToggle.setAttribute("aria-expanded", String(isHidden));
});

shareButton.addEventListener("click", shareCalculator);

initBrand();
initEducation();
setDirection("long");
