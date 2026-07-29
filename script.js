/**
 * Trade246 Calculation Logic Engine
 */

document.addEventListener("DOMContentLoaded", () => {
  // Mobile Drawer Toggle
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => mobileMenu.classList.toggle("hidden"));
  }

  // --- LEVERAGE & TRADITIONAL BROKER MATRIX ---
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
  const tradProfitVal = document.getElementById("tradProfitVal");
  const t246ProfitVal = document.getElementById("t246ProfitVal");
  const tradNetWorthVal = document.getElementById("tradNetWorthVal");
  const t246NetWorthVal = document.getElementById("t246NetWorthVal");
  const dynamicAdvantageBanner = document.getElementById("dynamicAdvantageBanner");

  // --- 1. LEAD GATEWAY FORM SUBMISSION ---
  if (leadForm) {
    leadForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const phone = leadPhone.value.trim();
      const phoneRegex = /^[6-9]\d{9}$/;

      if (!phoneRegex.test(phone)) {
        phoneValidationMsg.classList.remove("hidden");
        return;
      }
      phoneValidationMsg.classList.add("hidden");

      leadGateContainer.classList.add("hidden");
      calculatorContent.classList.remove("hidden");
      runCalculation();
    });
  }

  // --- 2. CONTROLS TOGGLES ---
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

  assetSelect.addEventListener("change", () => {
    updateControlVisibility();
    runCalculation();
  });

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
      btnHolding.className = "holding-btn active py-3 rounded-xl border-2 border-brandGreen bg-emerald-50 text-brandGreen font-bold text-sm";
      btnIntraday.className = "holding-btn py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:border-brandGreen";
      runCalculation();
    });
  }

  investmentSlider.addEventListener("input", runCalculation);
  profitSlider.addEventListener("input", runCalculation);

  // --- 3. CALCULATION ENGINE ---
  function runCalculation() {
    const capital = parseFloat(investmentSlider.value) || 1000;
    const profitMovePct = parseFloat(profitSlider.value) || 1;
    const selectedAsset = assetSelect.value;

    let rule;
    if (selectedAsset === "nse_options" || selectedAsset === "mcx_options") {
      rule = rulesMatrix[selectedAsset][currentOptionType][currentHoldingType];
    } else {
      rule = rulesMatrix[selectedAsset][currentHoldingType];
    }

    const t246Lev = rule.t246Lev;
    const tradLev = rule.tradLev;

    // Display Text Updates
    activeLeverageDisplay.innerText = rule.label;
    capitalValDisplay.innerText = `₹${capital.toLocaleString("en-IN")}`;
    profitPctDisplay.innerText = `${profitMovePct}%`;
    tableProfitPct.innerText = `${profitMovePct}%`;

    // Calculate Exposures
    const tradExposure = capital * tradLev;
    const t246Exposure = capital * t246Lev;

    // Calculate Profits
    const tradProfit = tradExposure * (profitMovePct / 100);
    const t246Profit = t246Exposure * (profitMovePct / 100);

    // Calculate Net Worth
    const tradNetWorth = capital + tradProfit;
    const t246NetWorth = capital + t246Profit;

    // INR Formatter
    const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    tradExposureVal.innerText = formatINR(tradExposure);
    t246ExposureVal.innerText = formatINR(t246Exposure);

    tradProfitVal.innerText = formatINR(tradProfit);
    t246ProfitVal.innerText = formatINR(t246Profit);

    tradNetWorthVal.innerText = formatINR(tradNetWorth);
    t246NetWorthVal.innerText = formatINR(t246NetWorth);

    // Dynamic Banner Advantage Text
    dynamicAdvantageBanner.innerText = `Net advantage with Trade246 : ${t246Lev}x more exposure`;
  }
});