const CART_STORAGE_KEY = "magacnetCart";
const ORDER_STORAGE_KEY = "magacnetOrder";

function escapeHtml(value) {
    const element = document.createElement("span");
    element.textContent = String(value);
    return element.innerHTML;
}

function getCart() {
    try {
        const cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
        return Array.isArray(cart) ? cart.filter((item) => item && item.available === true && item.domain) : [];
    } catch (error) {
        return [];
    }
}

function generateOrderReference() {
    const date = new Date();
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `MG-${datePart}-${randomPart}`;
}

function renderPayment() {
    const cart = getCart();
    const countElement = document.querySelector("#cart-count");
    const domainList = document.querySelector("#payment-domains");
    const subtotalElement = document.querySelector("#payment-subtotal");
    const totalElement = document.querySelector("#payment-total");

    if (countElement) countElement.textContent = String(cart.length);

    if (!cart.length) {
        domainList.innerHTML = `<div class="empty-payment">No active cart items were found.<br><a href="cart.html">Return to your cart</a></div>`;
        subtotalElement.textContent = "$0 USD";
        totalElement.textContent = "$0 USD";
        document.querySelector("#pay-button").disabled = true;
        return;
    }

    const subtotal = cart.reduce((total, item) => total + (Number(item.demonstrationPrice) || 0), 0);
    domainList.innerHTML = cart.map((item) => `
        <div class="payment-domain">
            <div><strong>${escapeHtml(item.domain)}</strong><span>${escapeHtml(item.extension || "")} - 1 year</span></div>
            <div class="payment-domain-price">${item.demonstrationPrice == null ? "Confirm" : `$${Number(item.demonstrationPrice)} USD`}</div>
        </div>`).join("");

    subtotalElement.textContent = `$${subtotal} USD`;
    totalElement.textContent = `$${subtotal} USD`;
}

function completeTestPayment() {
    const cart = getCart();
    if (!cart.length) {
        window.location.href = "cart.html";
        return;
    }

    const selectedMethod = document.querySelector('input[name="payment-method"]:checked');
    const methodError = document.querySelector("#method-error");
    if (!selectedMethod) {
        methodError.textContent = "Select a payment method to continue.";
        return;
    }

    methodError.textContent = "";
    const button = document.querySelector("#pay-button");
    button.disabled = true;
    button.textContent = "Processing Test Payment...";

    const subtotal = cart.reduce((total, item) => total + (Number(item.demonstrationPrice) || 0), 0);
    const order = {
        reference: generateOrderReference(),
        domains: cart.map((item) => ({
            domain: item.domain,
            extension: item.extension || null,
            status: item.status || "available",
            demonstrationPrice: item.demonstrationPrice ?? null,
            currency: item.currency || "USD",
            billingPeriod: item.billingPeriod || "year",
            quantity: 1
        })),
        amount: subtotal,
        currency: "USD",
        paymentMethod: selectedMethod.value,
        purchaseDate: new Date().toISOString(),
        simulated: true,
        registrationStatus: "not_registered_pending_registrar"
    };

    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
    localStorage.removeItem(CART_STORAGE_KEY);
    window.setTimeout(() => window.location.href = "success.html", 650);
}

document.querySelector("#pay-button")?.addEventListener("click", completeTestPayment);
document.querySelectorAll('input[name="payment-method"]').forEach((input) => {
    input.addEventListener("change", () => {
        document.querySelector("#method-error").textContent = "";
    });
});
renderPayment();
