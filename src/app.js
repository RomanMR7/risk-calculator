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
const riskRewardQualityLabel = document.querySelector("[data-rr-quality-label]");
const tradePlanCard = document.querySelector("[data-trade-plan-card]");
const tradePlan = document.querySelector("[data-trade-plan]");
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
let manualCopyTextArea = null;
let educationHighlightTimer = null;

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
  educationList.innerHTML = educationCards.map((card) => {
    const paragraphs = (card.paragraphs || [])
      .map((paragraph) => `<p>${paragraph}</p>`)
      .join("");
    const list = card.list
      ? `
        <div class="education-list-block">
          ${card.listTitle ? `<strong>${card.listTitle}</strong>` : ""}
          <ul>
            ${card.list.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>
      `
      : "";
    const table = card.table
      ? `
        <div class="education-table-wrap">
          <table class="education-table">
            <thead>
              <tr>${card.table.headers.map((header) => `<th>${header}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${card.table.rows.map((row) => `
                <tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `
      : "";
    const example = card.example
      ? `
        <div class="education-example">
          <strong>${card.example.title}</strong>
          ${card.example.rows.map((row) => `<span>${row}</span>`).join("")}
        </div>
      `
      : "";
    const note = card.note ? `<p class="education-note">${card.note}</p>` : "";

    return `
      <article class="education-item">
        <h3>${card.title}</h3>
        ${paragraphs}
        ${list}
        ${table}
        ${example}
        ${note}
      </article>
    `;
  }).join("");

  setEducationOpen(window.location.hash === "#education-section");
}

function setEducationOpen(isOpen) {
  educationPanel.hidden = !isOpen;
  educationPanel.classList.toggle("is-open", isOpen);
  educationToggle.setAttribute("aria-expanded", String(isOpen));
}

function highlightEducation(section) {
  clearTimeout(educationHighlightTimer);
  section.classList.remove("is-highlighted");
  void section.offsetWidth;
  section.classList.add("is-highlighted");

  educationHighlightTimer = window.setTimeout(() => {
    section.classList.remove("is-highlighted");
  }, 2000);
}

function openAndFocusEducation() {
  const section = document.getElementById("education-section");

  if (!section) {
    return;
  }

  setEducationOpen(true);

  window.setTimeout(() => {
    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    highlightEducation(section);
  }, 50);
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
    riskRewardQualityLabel.textContent = "";
    riskRewardQuality.dataset.tone = "neutral";
    return;
  }

  const quality = getRiskRewardQuality(data.riskReward);
  riskRewardQuality.hidden = false;
  riskRewardQualityLabel.textContent = quality.label;
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

function getFormattedResult(data) {
  return {
    riskAmount: formatNumber(data.riskAmount, 2),
    positionSizeUsd: formatNumber(data.positionSizeUsd, 2),
    quantity: formatNumber(data.quantity, 8),
    potentialProfit: formatNumber(data.potentialProfit, 2),
    riskReward: formatNumber(data.riskReward, 2),
  };
}

function getTradePlanText(input, data) {
  return buildTradePlan(input, getFormattedResult(data), brandConfig.disclaimer, {
    name: brandConfig.name,
    url: brandConfig.websiteUrl,
  });
}

function updateTradePlan(input, data) {
  if (!input || !data) {
    tradePlanCard.hidden = true;
    tradePlan.textContent = "";
    return;
  }

  tradePlan.textContent = getTradePlanText(input, data);
  tradePlanCard.hidden = false;
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
    updateTradePlan(input, data);
    if (persist) {
      safeWriteStorage(input);
    }
  } catch (event) {
    latestInput = null;
    latestResult = null;
    result.innerHTML = "";
    updateDistanceHints(null);
    updateRiskRewardQuality(null);
    updateTradePlan(null, null);
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

function clearManualCopyTextArea() {
  if (manualCopyTextArea) {
    manualCopyTextArea.remove();
    manualCopyTextArea = null;
  }
}

function createManualCopyTextArea(text) {
  clearManualCopyTextArea();

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.width = "1px";
  textArea.style.height = "1px";
  textArea.style.opacity = "0";
  textArea.style.pointerEvents = "none";
  document.body.append(textArea);
  textArea.focus();
  textArea.select();

  manualCopyTextArea = textArea;
  window.setTimeout(clearManualCopyTextArea, 5000);

  return textArea;
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch {
      // Some embedded browsers expose Clipboard API but block writes.
    }
  }

  createManualCopyTextArea(text);

  try {
    if (document.execCommand("copy")) {
      clearManualCopyTextArea();
      return "copied";
    }
  } catch {
    // Keep the text selected so the user can copy it manually.
  }

  return "selected";
}

async function copyTradePlan() {
  if (!latestInput || !latestResult) {
    showTemporaryStatus(copyPlanStatus, "Сначала заполните корректные значения");
    return;
  }

  const plan = getTradePlanText(latestInput, latestResult);

  try {
    const copyResult = await copyTextToClipboard(plan);
    const message = copyResult === "copied"
      ? "План сделки скопирован"
      : "План выделен: нажмите Ctrl+C";
    showTemporaryStatus(copyPlanStatus, message);
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

educationToggle.addEventListener("click", (event) => {
  event.preventDefault();
  openAndFocusEducation();
});

shareButton.addEventListener("click", shareCalculator);
resetButton.addEventListener("click", resetValues);
copyPlanButton.addEventListener("click", copyTradePlan);

initBrand();
initEducation();
initSavedState();
setDirection(fields.direction.value, false);

if (window.location.hash === "#education-section") {
  openAndFocusEducation();
}
