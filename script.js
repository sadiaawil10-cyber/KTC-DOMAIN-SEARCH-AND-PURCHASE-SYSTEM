
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

menuBtn.addEventListener("click", function() {
    navLinks.classList.toggle("show");
});


// page 2


const searchForm = document.getElementById("searchForm");
const domainInput = document.getElementById("domainInput");
const searchName = document.getElementById("searchName");

const domainRows = [...document.querySelectorAll(".domain-row")];
const filters = [...document.querySelectorAll(".filters button")];

searchForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = domainInput.value.trim().toLowerCase();

    if (name === "") {
        return;
    }

    searchName.textContent = "'" + name + "'";

    domainRows.forEach(function(row) {
        const extension = row.children[0].textContent.trim();
        row.querySelector("h4").childNodes[0].textContent =
            name + extension + " ";
    });
});

// Filter buttons
filters.forEach(function(button) {
    button.addEventListener("click", function() {

        filters.forEach(btn => btn.classList.remove("selected"));
        button.classList.add("selected");

        const filter = button.dataset.filter;

        let rows = [...domainRows];

        if (filter === "available") {
            rows = rows.filter(row => row.dataset.status === "available");
        }

        if (filter === "price") {
            rows.sort((a, b) =>
                Number(a.dataset.price) - Number(b.dataset.price)
            );
        }

        domainRows.forEach(row => row.style.display = "none");

        rows.forEach(row => row.style.display = "grid");
    });
});

// Add to cart
document.querySelectorAll(".cart").forEach(function(button) {
    button.addEventListener("click", function() {
        button.textContent = "✓ In Cart";
    });
});

// page 3

// script.js - Dynamic calculations & modal triggers
document.addEventListener('DOMContentLoaded', () => {
  const periodSelect = document.getElementById('periodSelect');
  const domainPriceDisplay = document.getElementById('domainPriceDisplay');
  const subtotalDisplay = document.getElementById('subtotalDisplay');
  const totalDisplay = document.getElementById('totalDisplay');
  const payButton = document.getElementById('payButton');

  const icannFee = 0.18;

  function updatePricing() {
    const selectedOption = periodSelect.options[periodSelect.selectedIndex];
    const basePrice = parseFloat(selectedOption.getAttribute('data-price') || '15.00');
    const total = basePrice + icannFee;

    domainPriceDisplay.textContent = '$' + basePrice.toFixed(2);
    subtotalDisplay.textContent = '$' + basePrice.toFixed(2);
    totalDisplay.textContent = '$' + total.toFixed(2);
  }

  if (periodSelect) {
    periodSelect.addEventListener('change', updatePricing);
  }

  if (payButton) {
    payButton.addEventListener('click', () => {
      const name = document.getElementById('fullName').value.trim();
      const email = document.getElementById('email').value.trim();
      if (!name || !email) {
        alert('Please complete all required fields.');
        return;
      }
      alert('Proceeding to Somali Mobile Money / Card authorization...');
    });
  }
});

// page 4


// Interactive functionality for sadiaNet Checkout
document.addEventListener('DOMContentLoaded', () => {
  const providerCards = document.querySelectorAll('.provider-card');
  const merchantIdEl = document.getElementById('merchant-id');
  const payBtn = document.getElementById('pay-btn');
  const phoneInput = document.getElementById('phone-input');

  // Handle provider selection
  providerCards.forEach(card => {
    card.addEventListener('click', () => {
      // Remove selected class from all
      providerCards.forEach(c => c.classList.remove('selected'));
      // Add to clicked card
      card.classList.add('selected');

      // Update Merchant ID badge
      const merchant = card.getAttribute('data-merchant');
      if (merchant && merchantIdEl) {
        merchantIdEl.textContent = '• Merchant ID: ' + merchant;
      }
    });
  });

  // Handle Pay Now click
  if (payBtn) {
    payBtn.addEventListener('click', () => {
      const selected = document.querySelector('.provider-card.selected');
      const providerName = selected ? selected.querySelector('.provider-name').textContent : 'Mobile Money';
      const phone = phoneInput ? phoneInput.value : '';

      // Prompt simulation
      payBtn.disabled = true;
      payBtn.textContent = 'Sending USSD Prompt...';

      setTimeout(() => {
        alert(
          'USSD Push Sent!\n\n' +
          'A prompt has been sent to +252 ' + phone + ' via ' + providerName + '.\n' +
          'Please enter your PIN on your mobile device to complete the domain payment.'
        );
        payBtn.disabled = false;
        payBtn.innerHTML = '<svg class="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Pay Now ($15.18)';
      }, 1000);
    });
  }
});


// page 5



// Interactive functionality for MagacNet Confirmation Page
document.addEventListener('DOMContentLoaded', () => {
  const btnDownload = document.getElementById('btn-download');
  const btnDashboard = document.getElementById('btn-dashboard');

  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      window.print();
    });
  }

  if (btnDashboard) {
    btnDashboard.addEventListener('click', () => {
      alert('Redirecting to your MagacNet Domain Management Dashboard for sadia.so...');
    });
  }
});




