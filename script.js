/**
 * Trade246 Interactive Platform Script
 */

document.addEventListener("DOMContentLoaded", () => {
  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => mobileMenu.classList.toggle("hidden"));
  }

  // --- LEVERAGE DATA MATRIX ---
  const leverageMatrix = {
    nse_bse_mcx: { intraday: [10, 50, 100, 500], overnight: [5, 10, 25, 50], tradIntraday: "5x", tradOvernight: "1x" },
    option:      { intraday: [2, 5, 8, 10],      overnight: [1, 2],         tradIntraday: "3x-4x", tradOvernight: "3x-4x" },
    eq:          { intraday: [2, 5, 10, 20],     overnight: [2, 5, 10],     tradIntraday: "5x", tradOvernight: "1x" },
    forex:       { intraday: [10, 25, 50, 100],   overnight: [10, 25, 50, 100], tradIntraday: "1x", tradOvernight: "1x" },
    crypto:      { intraday: [20, 50, 100, 200],  overnight: [20, 50, 100, 200], tradIntraday: "1x", tradOvernight: "1x" },
    us_equities: { intraday: [10, 25, 50, 100],   overnight: [10, 25, 50, 100], tradIntraday: "1x", tradOvernight: "1x" }
  };

  // State
  let currentHoldingType = "intraday";
  let selectedLeverage = 500;
  let userLeadData = { name: "", phone: "" };

  // DOM Elements
  const leadGateContainer = document.getElementById("leadGateContainer");
  const leadForm = document.getElementById("leadForm");
  const leadName = document.getElementById("leadName");
  const leadPhone = document.getElementById("leadPhone");
  const phoneValidationMsg = document.getElementById("phoneValidationMsg");
  const calculatorContent = document.getElementById("calculatorContent");

  const assetSelect = document.getElementById("assetSelect");
  const btnIntraday = document.getElementById("btnIntraday");
  const btnOvernight = document.getElementById("btnOvernight");
  const leverageContainer = document.getElementById("leverageContainer");
  const maxLeverageBadge = document.getElementById("maxLeverageBadge");

  const investmentInput = document.getElementById("investmentInput");
  const investmentSlider = document.getElementById("investmentSlider");

  const tradLeverageVal = document.getElementById("tradLeverageVal");
  const t246LeverageVal = document.getElementById("t246LeverageVal");
  const tradExposureVal = document.getElementById("tradExposureVal");
  const t246ExposureVal = document.getElementById("t246ExposureVal");
  const tradBrokerageVal = document.getElementById("tradBrokerageVal");

  // --- 1. LEAD CAPTURE FORM SUBMISSION ---
  if (leadForm) {
    leadForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = leadName.value.trim();
      const phone = leadPhone.value.trim();
      const indianPhoneRegex = /^[6-9]\d{9}$/;

      if (!indianPhoneRegex.test(phone)) {
        phoneValidationMsg.classList.remove("hidden");
        return;
      }
      phoneValidationMsg.classList.add("hidden");

      userLeadData = { name, phone };

      // Push Lead to Google Sheets Web App (Replace URL when deployed)
      const googleSheetScriptURL = "https://script.google.com/macros/s/AKfycbzM0HhybnJ12-PR3hOWIc48kHiASv2Ry58XmG4wXFnNOqZZ8u3LazP8TYKxJDLQ5ZmC/exec";
      if (googleSheetScriptURL && googleSheetScriptURL.startsWith("http")) {
        fetch(googleSheetScriptURL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name, phone: phone, timestamp: new Date().toISOString() })
        }).catch(err => console.error("Sheet Sync Error", err));
      }

      // Hide Gate and Reveal Calculator
      leadGateContainer.classList.add("hidden");
      calculatorContent.classList.remove("hidden");

      // Initialize Calculator Controls
      updateLeverageOptions();
      calculateComparison();
    });
  }

  // --- 2. DYNAMIC LEVERAGE SELECTOR ---
  function updateLeverageOptions() {
    const selectedAsset = assetSelect.value;
    const assetData = leverageMatrix[selectedAsset] || leverageMatrix.nse_bse_mcx;
    const options = assetData[currentHoldingType] || [1];

    leverageContainer.innerHTML = "";
    selectedLeverage = options[options.length - 1]; // Default to highest leverage option
    maxLeverageBadge.innerText = `Max: ${selectedLeverage}x`;

    options.forEach((lev) => {
      const btn = document.createElement("button");
      btn.innerText = `${lev}x`;
      btn.className = `py-2.5 rounded-xl border font-bold text-sm transition-all ${
        lev === selectedLeverage
          ? "border-2 border-brandGreen bg-emerald-50 text-brandGreen"
          : "border-gray-200 text-gray-700 hover:border-brandGreen"
      }`;

      btn.addEventListener("click", () => {
        document.querySelectorAll("#leverageContainer button").forEach((b) => {
          b.className = "py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:border-brandGreen font-bold text-sm";
        });
        btn.className = "py-2.5 rounded-xl border-2 border-brandGreen bg-emerald-50 text-brandGreen font-bold text-sm";
        selectedLeverage = lev;
        calculateComparison();
      });

      leverageContainer.appendChild(btn);
    });
  }

  // --- 3. EVENT LISTENERS FOR CALCULATOR ---
  if (assetSelect) {
    assetSelect.addEventListener("change", () => {
      updateLeverageOptions();
      calculateComparison();
    });
  }

  if (btnIntraday && btnOvernight) {
    btnIntraday.addEventListener("click", () => {
      currentHoldingType = "intraday";
      btnIntraday.className = "holding-btn active py-3 rounded-xl border-2 border-brandGreen bg-emerald-50 text-brandGreen font-bold text-sm";
      btnOvernight.className = "holding-btn py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:border-brandGreen";
      updateLeverageOptions();
      calculateComparison();
    });

    btnOvernight.addEventListener("click", () => {
      currentHoldingType = "overnight";
      btnOvernight.className = "holding-btn active py-3 rounded-xl border-2 border-brandGreen bg-emerald-50 text-brandGreen font-bold text-sm";
      btnIntraday.className = "holding-btn py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:border-brandGreen";
      updateLeverageOptions();
      calculateComparison();
    });
  }

  if (investmentInput && investmentSlider) {
    investmentInput.addEventListener("input", (e) => {
      investmentSlider.value = e.target.value;
      calculateComparison();
    });
    investmentSlider.addEventListener("input", (e) => {
      investmentInput.value = e.target.value;
      calculateComparison();
    });
  }

  // --- 4. MATH COMPARISON ENGINE ---
  function calculateComparison() {
    const capital = parseFloat(investmentInput.value) || 1000;
    const selectedAsset = assetSelect.value;
    const assetData = leverageMatrix[selectedAsset];

    const tradLeverageText = currentHoldingType === "intraday" ? assetData.tradIntraday : assetData.tradOvernight;
    
    // Convert trad leverage text to multiplier for calculation
    let tradMultiplier = 1;
    if (tradLeverageText.includes("5x")) tradMultiplier = 5;
    else if (tradLeverageText.includes("4x")) tradMultiplier = 4;
    else if (tradLeverageText.includes("3x")) tradMultiplier = 3;

    const tradExposure = capital * tradMultiplier;
    const t246Exposure = capital * selectedLeverage;

    // Brokerage comparison
    let tradFee = 20;
    if (selectedAsset === "eq" && currentHoldingType === "intraday") {
      tradFee = Math.min(tradExposure * 0.0003, 20);
    }

    const formatINR = (num) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);

    tradLeverageVal.innerText = tradLeverageText;
    t246LeverageVal.innerText = `${selectedLeverage}x`;

    tradExposureVal.innerText = formatINR(tradExposure);
    t246ExposureVal.innerText = formatINR(t246Exposure);

    tradBrokerageVal.innerText = `₹${tradFee.toFixed(0)} - ₹150`;
  }
});