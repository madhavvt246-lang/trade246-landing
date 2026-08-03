/**
 * TRADE246 Master Script - Comprehensive Brokerage & Tax Engine
 * Implements strict statutory rules for Indian Discount Brokers vs TRADE246.
 */

// 1. FORCE PAGE TO LOAD AT THE TOP
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener("DOMContentLoaded", () => {
  window.scrollTo(0, 0);

  // --- 2. LOGO FALLBACK HANDLING (HEADER & FOOTER) ---
  function setupLogoFallback(imgId, fallbackId) {
    const img = document.getElementById(imgId);
    const fallback = document.getElementById(fallbackId);

    if (img) {
      img.onerror = () => {
        img.classList.add("hidden");
        if (fallback) fallback.classList.remove("hidden");
      };

      if (img.complete && img.naturalWidth === 0) {
        img.classList.add("hidden");
        if (fallback) fallback.classList.remove("hidden");
      }
    }
  }

  setupLogoFallback("brandLogoImg", "brandLogoFallback");
  setupLogoFallback("footerLogoImg", "footerLogoFallback");

  // Mobile Navigation Drawer Toggle
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => mobileMenu.classList.toggle("hidden"));
  }

  // --- 3. DOM ELEMENTS ---
  const leadGateContainer = document.getElementById("leadGateContainer");
  const leadForm = document.getElementById("leadForm");
  const leadName = document.getElementById("leadName");
  const leadPhone = document.getElementById("leadPhone");
  const phoneValidationMsg = document.getElementById("phoneValidationMsg");
  const leadSubmitBtn = document.getElementById("leadSubmitBtn");
  const calculatorContent = document.getElementById("calculatorContent");

  // Calculator Controls
  const assetSelect = document.getElementById("assetSelect");
  const orderTypeSelect = document.getElementById("orderTypeSelect");
  const buyPriceInput = document.getElementById("buyPriceInput");
  const sellPriceInput = document.getElementById("sellPriceInput");
  const quantityInput = document.getElementById("quantityInput");

  // Calculator Displays
  const calcTotalTurnover = document.getElementById("calcTotalTurnover");
  const calcGrossProfit = document.getElementById("calcGrossProfit");
  const calcTotalBrokerage = document.getElementById("calcTotalBrokerage");
  const calcTotalTaxes = document.getElementById("calcTotalTaxes");
  const calcNetProfit = document.getElementById("calcNetProfit");

  // Comparison Card Displays (Traditional vs TRADE246)
  const tradExposureVal = document.getElementById("tradExposureVal");
  const t246ExposureVal = document.getElementById("t246ExposureVal");
  const tradGrossProfitVal = document.getElementById("tradGrossProfitVal");
  const t246GrossProfitVal = document.getElementById("t246GrossProfitVal");
  const tradProfitVal = document.getElementById("tradProfitVal");
  const t246ProfitVal = document.getElementById("t246ProfitVal");
  const tradNetWorthVal = document.getElementById("tradNetWorthVal");
  const t246NetWorthVal = document.getElementById("t246NetWorthVal");

  // Web App Endpoint for Google Apps Script Sheet backend
  const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzM0HhybnJ12-PR3hOWIc48kHiASv2Ry58XmG4wXFnNOqZZ8u3LazP8TYKxJDLQ5ZmC/exec";

  // --- 4. GOOGLE SHEET LEAD SUBMISSION ---
  async function submitLeadToBackend(name, phone) {
    const payload = {
      name: name,
      phone: phone,
      timestamp: new Date().toISOString(),
      source: "TRADE246 Calculator"
    };

    try {
      const existing = JSON.parse(localStorage.getItem("t246_leads") || "[]");
      existing.push(payload);
      localStorage.setItem("t246_leads", JSON.stringify(existing));
    } catch (e) {
      console.warn("LocalStorage backup error:", e);
    }

    try {
      await fetch(GOOGLE_SHEET_WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("JSON fetch failed, trying fallback:", err);
      try {
        const formData = new URLSearchParams();
        formData.append("name", name);
        formData.append("phone", phone);
        formData.append("timestamp", new Date().toISOString());

        await fetch(GOOGLE_SHEET_WEB_APP_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString()
        });
      } catch (fallbackErr) {
        console.error("Fallback submission failed:", fallbackErr);
      }
    }
  }

  if (leadForm) {
    leadForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = leadName.value.trim();
      const phone = leadPhone.value.trim();
      const phoneRegex = /^[6-9]\d{9}$/;

      if (!phoneRegex.test(phone)) {
        phoneValidationMsg.classList.remove("hidden");
        return;
      }
      phoneValidationMsg.classList.add("hidden");

      leadSubmitBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Unlocking Calculator...`;

      await submitLeadToBackend(name, phone);

      setTimeout(() => {
        leadGateContainer.classList.add("hidden");
        calculatorContent.classList.remove("hidden");
        runCalculation();
      }, 300);
    });
  }

  // Dynamic Options Population for Order Types based on Asset Class
  function populateOrderTypes() {
    if (!assetSelect || !orderTypeSelect) return;
    const category = assetSelect.value;
    orderTypeSelect.innerHTML = "";

    let options = [];
    if (category === "equity") {
      options = [
        { value: "delivery", text: "Delivery" },
        { value: "intraday", text: "Intraday" }
      ];
    } else if (category === "equity_options" || category === "commodity_options" || category === "currency_options") {
      options = [
        { value: "option_buying", text: "Option Buying" },
        { value: "option_selling", text: "Option Selling" }
      ];
    } else {
      options = [
        { value: "intraday", text: "Intraday" },
        { value: "holding", text: "Holding / Carry Forward" }
      ];
    }

    options.forEach(opt => {
      const el = document.createElement("option");
      el.value = opt.value;
      el.innerText = opt.text;
      orderTypeSelect.appendChild(el);
    });
  }

  if (assetSelect) {
    assetSelect.addEventListener("change", () => {
      populateOrderTypes();
      runCalculation();
    });
  }

  [orderTypeSelect, buyPriceInput, sellPriceInput, quantityInput].forEach(element => {
    if (element) {
      element.addEventListener("input", runCalculation);
      element.addEventListener("change", runCalculation);
    }
  });

  // --- 5. MASTER CALCULATION ENGINE ---
  function calculateTraditionalBrokerageAndTaxes(assetCategory, orderType, buyPrice, sellPrice, quantity) {
    const buyTurnover = buyPrice * quantity;
    const sellTurnover = sellPrice * quantity;
    const totalTurnover = buyTurnover + sellTurnover;
    const grossProfit = sellTurnover - buyTurnover;

    let brokerage = 0;
    let sttCtt = 0;
    let exchangeCharge = 0;
    let sebiFee = 0;
    let stampDuty = 0;

    // Standard SEBI Turnover fee (0.0001% on Total Turnover)
    sebiFee = totalTurnover * 0.000001;

    switch (assetCategory) {
      case "equity":
        if (orderType === "delivery") {
          // 1. Equity - Delivery
          brokerage = 0;
          sttCtt = (buyTurnover * 0.001) + (sellTurnover * 0.001);
          exchangeCharge = totalTurnover * 0.0000322;
          stampDuty = buyTurnover * 0.00015;
        } else {
          // 2. Equity - Intraday
          const buyBrok = Math.min(buyTurnover * 0.0003, 20);
          const sellBrok = Math.min(sellTurnover * 0.0003, 20);
          brokerage = buyBrok + sellBrok;

          sttCtt = sellTurnover * 0.00025;
          exchangeCharge = totalTurnover * 0.0000322;
          stampDuty = buyTurnover * 0.00003;
        }
        break;

      case "equity_futures":
        // 3. Equity Futures
        const buyBrokFut = Math.min(buyTurnover * 0.0003, 20);
        const sellBrokFut = Math.min(sellTurnover * 0.0003, 20);
        brokerage = buyBrokFut + sellBrokFut;

        sttCtt = sellTurnover * 0.0002;
        exchangeCharge = totalTurnover * 0.0000188;
        stampDuty = buyTurnover * 0.00002;
        break;

      case "equity_options":
        // 4. Equity Options
        brokerage = 40; // ₹20 Buy + ₹20 Sell
        sttCtt = sellTurnover * 0.001; // 0.1% on Premium Sell Turnover
        exchangeCharge = totalTurnover * 0.000495;
        stampDuty = buyTurnover * 0.00003;
        break;

      case "commodity_futures":
        // 5. Commodity Futures (MCX)
        const buyBrokCom = Math.min(buyTurnover * 0.0003, 20);
        const sellBrokCom = Math.min(sellTurnover * 0.0003, 20);
        brokerage = buyBrokCom + sellBrokCom;

        sttCtt = sellTurnover * 0.0001; // CTT 0.01% on Sell
        exchangeCharge = totalTurnover * 0.000021;
        stampDuty = buyTurnover * 0.00002;
        break;

      case "commodity_options":
        // 6. Commodity Options (MCX)
        brokerage = 40; // ₹20 Buy + ₹20 Sell
        sttCtt = sellTurnover * 0.0005; // CTT 0.05% on Sell
        exchangeCharge = totalTurnover * 0.000418;
        stampDuty = buyTurnover * 0.00003;
        break;

      case "currency_futures":
        // 7. Currency Futures (NSE)
        const buyBrokCur = Math.min(buyTurnover * 0.0003, 20);
        const sellBrokCur = Math.min(sellTurnover * 0.0003, 20);
        brokerage = buyBrokCur + sellBrokCur;

        sttCtt = 0;
        exchangeCharge = totalTurnover * 0.000009;
        stampDuty = buyTurnover * 0.000001;
        break;

      case "currency_options":
        // 8. Currency Options (NSE)
        brokerage = 40; // ₹20 Buy + ₹20 Sell
        sttCtt = 0;
        exchangeCharge = totalTurnover * 0.00035;
        stampDuty = buyTurnover * 0.000001;
        break;

      default:
        break;
    }

    // GST: 18% of (Brokerage + Exchange Transaction Charge + SEBI Turnover Fee)
    const gst = 0.18 * (brokerage + exchangeCharge + sebiFee);

    // Sum of Statutory Taxes
    const totalStatutoryTaxes = sttCtt + exchangeCharge + sebiFee + stampDuty + gst;
    const netProfit = grossProfit - brokerage - totalStatutoryTaxes;

    return {
      buyTurnover,
      sellTurnover,
      totalTurnover,
      grossProfit,
      brokerage,
      totalStatutoryTaxes,
      netProfit
    };
  }

  function runCalculation() {
    if (!buyPriceInput || !sellPriceInput || !quantityInput || !assetSelect) return;

    const buyPrice = parseFloat(buyPriceInput.value) || 0;
    const sellPrice = parseFloat(sellPriceInput.value) || 0;
    const quantity = parseFloat(quantityInput.value) || 0;
    const assetCategory = assetSelect.value;
    const orderType = orderTypeSelect ? orderTypeSelect.value : "intraday";

    const res = calculateTraditionalBrokerageAndTaxes(assetCategory, orderType, buyPrice, sellPrice, quantity);

    const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);

    // Update Breakdown Section
    if (calcTotalTurnover) calcTotalTurnover.innerText = formatINR(res.totalTurnover);
    if (calcGrossProfit) {
      calcGrossProfit.innerText = formatINR(res.grossProfit);
      calcGrossProfit.className = res.grossProfit >= 0 ? "text-emerald-600 font-bold" : "text-red-600 font-bold";
    }
    if (calcTotalBrokerage) calcTotalBrokerage.innerText = formatINR(res.brokerage);
    if (calcTotalTaxes) calcTotalTaxes.innerText = formatINR(res.totalStatutoryTaxes);
    if (calcNetProfit) {
      calcNetProfit.innerText = formatINR(res.netProfit);
      calcNetProfit.className = res.netProfit >= 0 ? "text-emerald-600 font-bold text-xl" : "text-red-600 font-bold text-xl";
    }

    // Update Comparison Cards (Traditional vs TRADE246)
    if (tradExposureVal) tradExposureVal.innerText = formatINR(res.totalTurnover);
    if (t246ExposureVal) t246ExposureVal.innerText = formatINR(res.totalTurnover);

    if (tradGrossProfitVal) tradGrossProfitVal.innerText = formatINR(res.grossProfit);
    if (t246GrossProfitVal) t246GrossProfitVal.innerText = formatINR(res.grossProfit);

    if (tradProfitVal) tradProfitVal.innerText = formatINR(res.netProfit);
    if (t246ProfitVal) t246ProfitVal.innerText = formatINR(res.grossProfit); // ₹0 Brokerage & ₹0 Taxes on TRADE246

    const initialCapital = res.buyTurnover;
    if (tradNetWorthVal) tradNetWorthVal.innerText = formatINR(initialCapital + res.netProfit);
    if (t246NetWorthVal) t246NetWorthVal.innerText = formatINR(initialCapital + res.grossProfit);
  }

  // Initial population call
  populateOrderTypes();
});

// Final fallback to force scroll position at top on full window load
window.onload = () => {
  window.scrollTo(0, 0);
};