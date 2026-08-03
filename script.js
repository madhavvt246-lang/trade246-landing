/**
 * TRADE246 Master Script
 * Integrated Master Calculation Rules Matrix for Traditional Broker Comparison.
 */

// Force page to load at the top
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener("DOMContentLoaded", () => {
  window.scrollTo(0, 0);

  // --- LOGO FALLBACK HANDLING ---
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

  // --- LEVERAGE & DISPLAY DISPLAY MATRIX ---
  const rulesMatrix = {
    nse_futures: {
      intraday: { t246Lev: 500, tradLev: 5, label: "500x (0.20% Margin)" },
      holding:  { t246Lev: 50,  tradLev: 1, label: "50x (2.00% Margin)" }
    },
    mcx_futures: {
      intraday: { t246Lev: 500, tradLev: 5, label: "500x (0.20% Margin)" },
      holding:  { t246Lev: 20,  tradLev: 1, label: "20x (5.00% Margin)" }
    },
    nse_options: {
      buying: {
        intraday: { t246Lev: 10, tradLev: 1, label: "10x (10% Premium Upfront)" },
        holding:  { t246Lev: 2,  tradLev: 1, label: "2x (50% Premium Upfront)" }
      },
      selling: {
        intraday: { t246Lev: 16, tradLev: 1, label: "Flat ₹7,500 / Lot (~16x vs ₹1.2L SPAN)" },
        holding:  { t246Lev: 6,  tradLev: 1, label: "Flat ₹20,000 / Lot (~6x vs ₹1.2L SPAN)" }
      }
    },
    mcx_options: {
      buying: {
        intraday: { t246Lev: 10, tradLev: 1, label: "10x (10% Premium Upfront)" },
        holding:  { t246Lev: 2,  tradLev: 1, label: "2x (50% Premium Upfront)" }
      },
      selling: {
        intraday: { t246Lev: 13.3, tradLev: 1, label: "Flat ₹7,500 / Lot (~13.3x vs ₹1L SPAN)" },
        holding:  { t246Lev: 5,    tradLev: 1, label: "Flat ₹20,000 / Lot (~5x vs ₹1L SPAN)" }
      }
    },
    nse_equity: {
      intraday: { t246Lev: 20, tradLev: 5, label: "20x (5.00% Margin)" },
      holding:  { t246Lev: 10, tradLev: 1, label: "10x (10.00% Margin)" }
    },
    crypto: {
      intraday: { t246Lev: 200, tradLev: 1, label: "200x (0.50% Margin)" },
      holding:  { t246Lev: 200, tradLev: 1, label: "200x (0.50% Margin)" }
    },
    forex: {
      intraday: { t246Lev: 100, tradLev: 1, label: "100x (1.00% Margin)" },
      holding:  { t246Lev: 100, tradLev: 1, label: "100x (1.00% Margin)" }
    },
    us_stocks: {
      intraday: { t246Lev: 100, tradLev: 1, label: "100x (1.00% Margin)" },
      holding:  { t246Lev: 100, tradLev: 1, label: "100x (1.00% Margin)" }
    }
  };

  // Active State Variables
  let currentHoldingType = "intraday";
  let currentOptionType = "buying";

  // DOM Elements
  const leadGateContainer = document.getElementById("leadGateContainer");
  const leadForm = document.getElementById("leadForm");
  const leadName = document.getElementById("leadName");
  const leadPhone = document.getElementById("leadPhone");
  const phoneValidationMsg = document.getElementById("phoneValidationMsg");
  const leadSubmitBtn = document.getElementById("leadSubmitBtn");
  const calculatorContent = document.getElementById("calculatorContent");

  const assetSelect = document.getElementById("assetSelect");
  const optionTypeWrapper = document.getElementById("optionTypeWrapper");
  const btnOptionBuy = document.getElementById("btnOptionBuy");
  const btnOptionSell = document.getElementById("btnOptionSell");
  
  const btnIntraday = document.getElementById("btnIntraday");
  const btnHolding = document.getElementById("btnHolding");
  const stepHoldingNum = document.getElementById("stepHoldingNum");

  const activeLeverageDisplay = document.getElementById("activeLeverageDisplay");
  const investmentSlider = document.getElementById("investmentSlider");
  const capitalValDisplay = document.getElementById("capitalValDisplay");

  const profitSlider = document.getElementById("profitSlider");
  const profitPctDisplay = document.getElementById("profitPctDisplay");

  const tradExposureVal = document.getElementById("tradExposureVal");
  const t246ExposureVal = document.getElementById("t246ExposureVal");
  const tableProfitPct = document.getElementById("tableProfitPct");
  
  const tradGrossProfitVal = document.getElementById("tradGrossProfitVal");
  const t246GrossProfitVal = document.getElementById("t246GrossProfitVal");
  
  const tradProfitVal = document.getElementById("tradProfitVal");
  const t246ProfitVal = document.getElementById("t246ProfitVal");
  
  const tradNetWorthVal = document.getElementById("tradNetWorthVal");
  const t246NetWorthVal = document.getElementById("t246NetWorthVal");
  const dynamicAdvantageBanner = document.getElementById("dynamicAdvantageBanner");

  // Web App Endpoint
  const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzM0HhybnJ12-PR3hOWIc48kHiASv2Ry58XmG4wXFnNOqZZ8u3LazP8TYKxJDLQ5ZmC/exec";

  // --- GOOGLE SHEET LEAD SUBMISSION ---
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

  // --- CALCULATOR CONTROLS ---
  function updateControlVisibility() {
    const selectedAsset = assetSelect.value;
    
    if (selectedAsset === "nse_options" || selectedAsset === "mcx_options") {
      optionTypeWrapper.classList.remove("hidden");
      stepHoldingNum.innerText = "3";
    } else {
      optionTypeWrapper.classList.add("hidden");
      stepHoldingNum.innerText = "2";
    }
  }

  if (assetSelect) {
    assetSelect.addEventListener("change", () => {
      updateControlVisibility();
      runCalculation();
    });
  }

  if (btnOptionBuy && btnOptionSell) {
    btnOptionBuy.addEventListener("click", () => {
      currentOptionType = "buying";
      btnOptionBuy.className = "option-type-btn active py-3 rounded-xl border-2 border-brandGreen bg-emerald-50 text-brandGreen font-bold text-sm";
      btnOptionSell.className = "option-type-btn py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:border-brandGreen";
      runCalculation();
    });

    btnOptionSell.addEventListener("click", () => {
      currentOptionType = "selling";
      btnOptionSell.className = "option-type-btn active py-3 rounded-xl border-2 border-brandGreen bg-emerald-50 text-brandGreen font-bold text-sm";
      btnOptionBuy.className = "option-type-btn py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:border-brandGreen";
      runCalculation();
    });
  }

  if (btnIntraday && btnHolding) {
    btnIntraday.addEventListener("click", () => {
      currentHoldingType = "intraday";
      btnIntraday.className = "holding-btn active py-3 rounded-xl border-2 border-brandGreen bg-emerald-50 text-brandGreen font-bold text-sm";
      btnHolding.className = "holding-btn py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:border-brandGreen";
      runCalculation();
    });

    btnHolding.addEventListener("click", () => {
      currentHoldingType = "holding";
      btnIntraday.className = "holding-btn active py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:border-brandGreen";
      btnHolding.className = "holding-btn active py-3 rounded-xl border-2 border-brandGreen bg-emerald-50 text-brandGreen font-bold text-sm";
      runCalculation();
    });
  }

  if (investmentSlider) investmentSlider.addEventListener("input", runCalculation);
  if (profitSlider) profitSlider.addEventListener("input", runCalculation);

 // --- MASTER CALCULATION MATRIX ENGINE ---
  function runCalculation() {
    if (!investmentSlider || !profitSlider || !assetSelect) return;

    const capital = parseFloat(investmentSlider.value) || 1000;
    const profitMovePct = parseFloat(profitSlider.value) || 1;
    const selectedAsset = assetSelect.value;

    // Minimum margin required by traditional brokers for selling options (~1.2L per lot)
    const TRADITIONAL_OPTION_SELLING_MIN_MARGIN = 120000;

    let rule;
    if (selectedAsset === "nse_options" || selectedAsset === "mcx_options") {
      rule = rulesMatrix[selectedAsset][currentOptionType][currentHoldingType];
    } else {
      rule = rulesMatrix[selectedAsset][currentHoldingType];
    }

    const t246Lev = rule.t246Lev;
    const tradLev = rule.tradLev;

    // Check if user is attempting option selling with insufficient margin for traditional brokers
    const isOptionSelling = (selectedAsset === "nse_options" || selectedAsset === "mcx_options") && currentOptionType === "selling";
    const isInsufficientTradMargin = isOptionSelling && capital < TRADITIONAL_OPTION_SELLING_MIN_MARGIN;

    // Display Updates
    if (activeLeverageDisplay) activeLeverageDisplay.innerText = rule.label;
    if (capitalValDisplay) capitalValDisplay.innerText = `₹${capital.toLocaleString("en-IN")}`;
    if (profitPctDisplay) profitPctDisplay.innerText = `${profitMovePct}%`;
    if (tableProfitPct) tableProfitPct.innerText = `${profitMovePct}%`;

    // 1. Exposure Metrics
    const tradExposure = isInsufficientTradMargin ? 0 : capital * tradLev;
    const t246Exposure = capital * t246Lev;

    const buyTurnover = tradExposure;
    const sellTurnover = buyTurnover * (1 + (profitMovePct / 100));
    const totalTurnover = buyTurnover + sellTurnover;

    const tradGrossProfit = isInsufficientTradMargin ? 0 : (sellTurnover - buyTurnover);
    const t246GrossProfit = (t246Exposure * (1 + (profitMovePct / 100))) - t246Exposure;

    // 2. Strict Friction Computation (Traditional Broker)
    let brokerage = 0;
    let sttCttTds = 0;
    let exchangeFees = 0;
    let sebiFees = 0;
    let stampDuty = 0;
    let incomeTax = 0;
    let fxFees = 0;

    if (!isInsufficientTradMargin && capital > 0) {
      switch (selectedAsset) {
        case "nse_futures":
          brokerage = Math.min(0.0003 * buyTurnover, 20) + Math.min(0.0003 * sellTurnover, 20);
          sttCttTds = 0.0002 * sellTurnover;
          exchangeFees = 0.0000188 * totalTurnover;
          sebiFees = 0.000001 * totalTurnover;
          stampDuty = 0.00002 * buyTurnover;
          break;

        case "nse_options":
          brokerage = 20 + 20; // Flat ₹20 Buy + ₹20 Sell
          sttCttTds = 0.001 * sellTurnover; // 0.1% STT on Premium Sell
          exchangeFees = 0.000495 * totalTurnover;
          sebiFees = 0.000001 * totalTurnover;
          stampDuty = 0.00003 * buyTurnover;
          break;

        case "mcx_futures":
          brokerage = Math.min(0.0003 * buyTurnover, 20) + Math.min(0.0003 * sellTurnover, 20);
          sttCttTds = 0.0001 * sellTurnover;
          exchangeFees = 0.000021 * totalTurnover;
          sebiFees = 0.000001 * totalTurnover;
          stampDuty = 0.00002 * buyTurnover;
          break;

        case "mcx_options":
          brokerage = 20 + 20;
          sttCttTds = 0.0005 * sellTurnover;
          exchangeFees = 0.000418 * totalTurnover;
          sebiFees = 0.000001 * totalTurnover;
          stampDuty = 0.00003 * buyTurnover;
          break;

        case "nse_equity":
          if (currentHoldingType === "holding") {
            brokerage = 0;
            sttCttTds = (0.001 * buyTurnover) + (0.001 * sellTurnover);
            stampDuty = 0.00015 * buyTurnover;
          } else {
            brokerage = Math.min(0.0003 * buyTurnover, 20) + Math.min(0.0003 * sellTurnover, 20);
            sttCttTds = 0.00025 * sellTurnover;
            stampDuty = 0.00003 * buyTurnover;
          }
          exchangeFees = 0.0000322 * totalTurnover;
          sebiFees = 0.000001 * totalTurnover;
          break;

        case "crypto":
          brokerage = (0.005 * buyTurnover) + (0.005 * sellTurnover);
          sttCttTds = 0.01 * sellTurnover;
          if (tradGrossProfit > 0) incomeTax = 0.30 * tradGrossProfit;
          break;

        case "forex":
          brokerage = 0.0020 * totalTurnover;
          fxFees = 0.01 * capital;
          break;

        case "us_stocks":
          brokerage = 166 + 166; // ~$2 buy + $2 sell in INR
          fxFees = 0.015 * totalTurnover;
          break;
      }
    }

    // GST 18% on (Brokerage + Exchange Fees + SEBI Fees)
    const gst = 0.18 * (brokerage + exchangeFees + sebiFees);

    const totalDeductions = brokerage + sttCttTds + exchangeFees + sebiFees + stampDuty + gst + incomeTax + fxFees;

    // Net Take-Home Calculations (Floor at 0 if fees exceed gross return)
    const tradNetProfit = isInsufficientTradMargin ? 0 : Math.max(0, tradGrossProfit - totalDeductions);
    const t246NetProfit = t246GrossProfit; 

    const tradNetWorth = isInsufficientTradMargin ? capital : (capital + (tradGrossProfit - totalDeductions));
    const t246NetWorth = capital + t246NetProfit;

    const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    // DOM Updates
    if (tradExposureVal) tradExposureVal.innerText = isInsufficientTradMargin ? "₹0 (Blocked)" : formatINR(tradExposure);
    if (t246ExposureVal) t246ExposureVal.innerText = formatINR(t246Exposure);

    if (tradGrossProfitVal) tradGrossProfitVal.innerText = isInsufficientTradMargin ? "N/A" : formatINR(tradGrossProfit);
    if (t246GrossProfitVal) t246GrossProfitVal.innerText = formatINR(t246GrossProfit);

    if (tradProfitVal) tradProfitVal.innerText = isInsufficientTradMargin ? "₹0 (No Margin)" : formatINR(tradNetProfit);
    if (t246ProfitVal) t246ProfitVal.innerText = formatINR(t246NetProfit);

    if (tradNetWorthVal) tradNetWorthVal.innerText = formatINR(tradNetWorth);
    if (t246NetWorthVal) t246NetWorthVal.innerText = formatINR(t246NetWorth);

    if (dynamicAdvantageBanner) {
      dynamicAdvantageBanner.innerText = `Net advantage with TRADE246 : ${t246Lev}x more exposure`;
    }
  }
});

// Ensure top position after full window load
window.onload = () => {
  window.scrollTo(0, 0);
};