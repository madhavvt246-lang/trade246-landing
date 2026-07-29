/**
 * TRADE246 Calculation Engine & Google Sheet Lead Capture
 */

document.addEventListener("DOMContentLoaded", () => {
  // Mobile Navigation Drawer Toggle
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

  // Web App Endpoint provided for Google Apps Script Sheet backend
  const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzM0HhybnJ12-PR3hOWIc48kHiASv2Ry58XmG4wXFnNOqZZ8u3LazP8TYKxJDLQ5ZmC/exec";

  // --- 1. GOOGLE SHEET LEAD SUBMISSION ---
  async function submitLeadToBackend(name, phone) {
    const payload = {
      name: name,
      phone: phone,
      timestamp: new Date().toISOString(),
      source: "TRADE246 Calculator"
    };

    // Backup to LocalStorage
    try {
      const existing = JSON.parse(localStorage.getItem("t246_leads") || "[]");
      existing.push(payload);
      localStorage.setItem("t246_leads", JSON.stringify(existing));
    } catch (e) {
      console.warn("LocalStorage backup error:", e);
    }

    // Direct fetch to Apps Script Web App
    try {
      await fetch(GOOGLE_SHEET_WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Fetch JSON failed, trying URLSearchParams fallback:", err);
      // Fallback method using standard form encoded URL parameters
      try {
        const formData = new URLSearchParams();
        formData.append("name", name);
        formData.append("phone", phone);
        formData.append("timestamp", new Date().toISOString());

        await fetch(GOOGLE_SHEET_WEB_APP_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
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

      // Trigger Lead Recording
      await submitLeadToBackend(name, phone);

      // Transition UI to Calculator
      setTimeout(() => {
        leadGateContainer.classList.add("hidden");
        calculatorContent.classList.remove("hidden");
        runCalculation();
      }, 300);
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
      btnHolding.className = "holding-btn active py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:border-brandGreen";
      btnIntraday.className = "holding-btn py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:border-brandGreen";
      btnHolding.className = "holding-btn active py-3 rounded-xl border-2 border-brandGreen bg-emerald-50 text-brandGreen font-bold text-sm";
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

    // Exposures
    const tradExposure = capital * tradLev;
    const t246Exposure = capital * t246Lev;

    // Gross Profits
    const tradGrossProfit = tradExposure * (profitMovePct / 100);
    const t246GrossProfit = t246Exposure * (profitMovePct / 100);

    // Taxation & Fees Calculation (Avg 12% tax deduction on traditional vs 0% on TRADE246)
    const tradTaxRate = 0.12; 
    const tradNetProfit = Math.max(0, tradGrossProfit * (1 - tradTaxRate) - 30);
    const t246NetProfit = t246GrossProfit; // 0 tax & 0 brokerage

    // Account Totals
    const tradNetWorth = capital + tradNetProfit;
    const t246NetWorth = capital + t246NetProfit;

    // INR Formatter
    const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    tradExposureVal.innerText = formatINR(tradExposure);
    t246ExposureVal.innerText = formatINR(t246Exposure);

    tradGrossProfitVal.innerText = formatINR(tradGrossProfit);
    t246GrossProfitVal.innerText = formatINR(t246GrossProfit);

    tradProfitVal.innerText = formatINR(tradNetProfit);
    t246ProfitVal.innerText = formatINR(t246NetProfit);

    tradNetWorthVal.innerText = formatINR(tradNetWorth);
    t246NetWorthVal.innerText = formatINR(t246NetWorth);

    // Dynamic Banner Advantage Text
    dynamicAdvantageBanner.innerText = `Net advantage with TRADE246 : ${t246Lev}x more exposure`;
  }
});