import { calculatePosition, round } from "./calculator.js";
import { brandConfig } from "./config/brand.js";
import { educationCards } from "./content/education.js";
import { getRiskRewardQuality } from "./utils/rrQuality.js";
import { buildTradePlan } from "./utils/tradePlan.js";

const STORAGE_KEY = "riskCalculatorState";
const DEFAULT_VALUES = {
  deposit: "1000",
  riskPercent: "1",
  direction: "long",
  entryPrice: "100",
  stopLossPrice: "98",
  takeProfitPrice: "106",
};

const form = document.querySelector("[data-form]");
const result = document.querySelector("[data-result]");
const error = document.querySelector("[data-error]");
const brandName = document.querySelector("[data-brand-name]");
const brandShort = document.querySelector("[data-brand-short]");
const brandDescription = document.querySelector("[data-brand-description]");
const brandTagline = document.querySelector("[data-brand-tagline]");
const brandMark = document.querySelector("[data-brand-mark]");
const brandLogo = document.querySelector("[data-brand-logo]");
const telegramLink = document.querySelector("[data-telegram-link]");
const socialLinks = document.querySelector("[data-social-links]");
const educationToggle = document.querySelector("[data-education-toggle]");
const educationPanel = document.querySelector("[data-education-panel]");
const educationList = document.querySelector("[data-education-list]");
const disclaimer = document.querySelector("[data-disclaimer]");
const shareButton = document.querySelector("[data-share-button]");
const shareStatus = document.querySelector("[data-share-status]");
const resetButton = document.querySelector("[data-reset-button]");
const copyPlanButton = document.querySelector("[data-copy-plan-button]");
const copyPlanStatus = document.querySelector("[data-copy-plan-status]");
const riskRewardQuality = document.querySelector("[data-rr-quality]");
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

let latestInput = null;
let latestResult = null;
let statusTimer = null;

const socialLabels = {
  telegram: "Telegram",
  youtube: "YouTube",
  instagram: "Instagram",
  website: "Сайт",
};

function getBrandInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function initBrand() {
  brandName.textContent = brandConfig.name;
  brandShort.textContent = brandConfig.shortName;
  brandDescription.textContent = brandConfig.description;
  brandTagline.textContent = brandConfig.tagline;
  telegramLink.href = brandConfig.telegramUrl;
  telegramLink.textContent = brandConfig.primaryCtaText;
  educationToggle.textContent = brandConfig.educationalCtaText;
  disclaimer.textContent = brandConfig.disclaimer;

  if (brandConfig.logoUrl) {
    brandLogo.src = brandConfig.logoUrl;
    brandLogo.alt = brandConfig.logoAlt;
    brandLogo.hidden = false;
    brandMark.hidden = true;
  } else {
    brandMark.textContent = getBrandInitials(brandConfig.name);
    brandLogo.hidden = true;
    brandMark.hidden = false;
  }

  const socialItems = Object.entries(brandConfig.socials)
    .filter(([, url]) => Boolean(url))
    .map(([key, url]) => `
      <a href="${url}" target="_blank" rel="noopener noreferrer">${socialLabels[key] || key}</a>
    `);

  socialLinks.innerHTML = socialItems.join("");
  socialLinks.hidden = socialItems.length === 0;
}

function initEducation() {
  educationList.innerHTML = educationCards.map((card) => `
    <article class="education-item">
      <h3>${card.title}</h3>
      <p>${card.body}</p>
    </article>
  `).join("");
}

function safeReadStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function safeWriteStorage(input) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
  } catch {
    // Storage may be unavailable in private mode or restricted environments.
  }
}

function safeClearStorage() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage may be unavailable in private mode or restricted environments.
  }
}

function applyInput(input) {
  fields.deposit.value = input.deposit;
  fields.riskPercent.value = input.riskPercent;
  fields.direction.value = input.direction;
  fields.entryPrice.value = input.entryPrice;
  fields.stopLossPrice.value = input.stopLossPrice;
  fields.takeProfitPrice.value = input.takeProfitPrice;
}

function initSavedState() {
  applyInput({ ...DEFAULT_VALUES, ...safeReadStorage() });
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

function setDirection(direction, persist = true) {
  fields.direction.value = direction;
  directionButtons.forEach((button) => {
    const active = button.dataset.direction === direction;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  calculate(persist);
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

function updateRiskRewardQuality(data) {
  if (!data) {
    riskRewardQuality.hidden = true;
    riskRewardQuality.textContent = "";
    riskRewardQuality.dataset.tone = "neutral";
    return;
  }

  const quality = getRiskRewardQuality(data.riskReward);
  riskRewardQuality.hidden = false;
  riskRewardQuality.textContent = quality.label;
  riskRewardQuality.dataset.tone = quality.tone;
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

function calculate(persist = true) {
  updateRiskUi();

  try {
    const input = readInput();
    const data = calculatePosition(input);
    latestInput = input;
    latestResult = data;
    error.textContent = "";
    updateDistanceHints(data);
    updateRiskRewardQuality(data);
    render(data);
    if (persist) {
      safeWriteStorage(input);
    }
  } catch (event) {
    latestInput = null;
    latestResult = null;
    result.innerHTML = "";
    updateDistanceHints(null);
    updateRiskRewardQuality(null);
    error.textContent = event.message;
  }
}

function resetValues() {
  safeClearStorage();
  applyInput(DEFAULT_VALUES);
  setDirection(DEFAULT_VALUES.direction, false);
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

function showTemporaryStatus(element, message) {
  element.textContent = message;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    element.textContent = "";
  }, 2200);
}

async function copyTradePlan() {
  if (!latestInput || !latestResult) {
    showTemporaryStatus(copyPlanStatus, "Сначала заполните корректные значения");
    return;
  }

  const formattedResult = {
    riskAmount: formatNumber(latestResult.riskAmount, 2),
    positionSizeUsd: formatNumber(latestResult.positionSizeUsd, 2),
    quantity: formatNumber(latestResult.quantity, 8),
    potentialProfit: formatNumber(latestResult.potentialProfit, 2),
    riskReward: formatNumber(latestResult.riskReward, 2),
  };
  const plan = buildTradePlan(latestInput, formattedResult, brandConfig.disclaimer);

  try {
    await navigator.clipboard.writeText(plan);
    showTemporaryStatus(copyPlanStatus, "План сделки скопирован");
  } catch {
    showTemporaryStatus(copyPlanStatus, "Не удалось скопировать план");
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
resetButton.addEventListener("click", resetValues);
copyPlanButton.addEventListener("click", copyTradePlan);

initBrand();
initEducation();
initSavedState();
setDirection(fields.direction.value, false);
