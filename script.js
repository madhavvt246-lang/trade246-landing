/**
 * Trade246 Platform Logic
 * Handles calculator math, validation, and dynamic WhatsApp redirection
 */

document.addEventListener("DOMContentLoaded", () => {
  // Mobile Nav Toggle
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
  }

  // Calculator DOM Elements
  const assetSelect = document.getElementById("assetSelect");
  const investmentInput = document.getElementById("investmentInput");
  const investmentSlider = document.getElementById("investmentSlider");
  const leverageBtns = document.querySelectorAll(".leverage-btn");
  
  const exposureVal = document.getElementById("exposureVal");
  const potentialProfitVal = document.getElementById("potentialProfitVal");
  const tradCost = document.getElementById("tradCost");
  const totalSavingsDisplay = document.getElementById("totalSavingsDisplay");
  const monthlySavings = document.getElementById("monthlySavings");
  const amountValidationMsg = document.getElementById("amountValidationMsg");
  const whatsappRedirectBtn = document.getElementById("whatsappRedirectBtn");

  // State Variables
  let selectedLeverage = 5; // Default 5x leverage

  // Sync Input and Slider
  investmentInput.addEventListener("input", (e) => {
    let val = parseFloat(e.target.value) || 0;
    
    // Anti-spam & quality validation check
    if (val < 1000) {
      amountValidationMsg.classList.remove("hidden");
    } else {
      amountValidationMsg.classList.add("hidden");
    }

    investmentSlider.value = val;
    calculateSavings();
  });

  investmentSlider.addEventListener("input", (e) => {
    investmentInput.value = e.target.value;
    amountValidationMsg.classList.add("hidden");
    calculateSavings();
  });

  // Handle Leverage Selection
  leverageBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      leverageBtns.forEach((b) => {
        b.classList.remove("active", "border-2", "border-brandGreen", "bg-emerald-50", "text-brandGreen");
        b.classList.add("border-gray-200", "text-gray-700");
      });

      btn.classList.add("active", "border-2", "border-brandGreen", "bg-emerald-50", "text-brandGreen");
      btn.classList.remove("border-gray-200", "text-gray-700");

      selectedLeverage = parseFloat(btn.getAttribute("data-leverage")) || 1;
      calculateSavings();
    });
  });

  assetSelect.addEventListener("change", calculateSavings);

  // Calculator Core Logic
  function calculateSavings() {
    let investment = parseFloat(investmentInput.value) || 0;

    // Strict minimum boundary
    if (investment < 1000) {
      investment = 1000;
    }

    const totalExposure = investment * selectedLeverage;
    const baselineProfit = totalExposure * 0.10; // 10% market swing

    // Traditional Broker Fee Calculation Logic
    const assetCategory = assetSelect.value;
    let traditionalFee = 0;

    if (assetCategory === "equity_intraday" || assetCategory === "equity_futures") {
      // 0.03% capped at ₹20 per order
      const calculatedPercentage = totalExposure * 0.0003;
      traditionalFee = Math.min(calculatedPercentage, 20);
      // Ensure flat ₹20 if leveraged turnover is high
      if (traditionalFee < 20 && totalExposure >= 66667) {
        traditionalFee = 20;
      }
    } else {
      // Flat ₹20 per order for Options, Commodities, Currency
      traditionalFee = 20.00;
    }

    const trade246Fee = 0.00;
    const totalSaved = traditionalFee - trade246Fee;
    const estimatedMonthlySaved = totalSaved * 50; // 50 trades per month estimate

    // Format Currency Numbers to INR
    const formatINR = (num) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);

    // Update UI Elements
    exposureVal.innerText = formatINR(totalExposure);
    potentialProfitVal.innerText = formatINR(baselineProfit);
    tradCost.innerText = formatINR(traditionalFee);
    totalSavingsDisplay.innerText = formatINR(totalSaved);
    monthlySavings.innerText = formatINR(estimatedMonthlySaved);
  }

  // Initial Calculation Run
  calculateSavings();

  // WhatsApp Pre-filled Redirect Scripting
  whatsappRedirectBtn.addEventListener("click", () => {
    let investment = parseFloat(investmentInput.value) || 0;

    if (investment < 1000) {
      alert("Please enter a valid investment capital (Minimum ₹1,000).");
      return;
    }

    const assetName = assetSelect.options[assetSelect.selectedIndex].text;
    const leverageText = `${selectedLeverage}x`;
    const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(investment);

    // Personalized WhatsApp script
    const message = `Hi Trade246 team, I am planning to trade in ${assetName} with an investment of ${formattedAmount} and ${leverageText} leverage. I see I can save on traditional brokerage fees. Please help me set up my account!`;

    // Encode for URL query string
    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = "919876543210"; // Replace with your company WhatsApp number

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  });
});