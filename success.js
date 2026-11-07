const CART_STORAGE_KEY = "magacnetCart";
const ORDER_STORAGE_KEY = "magacnetOrder";

function escapeHtml(value) {
    const element = document.createElement("span");
    element.textContent = String(value);
    return element.innerHTML;
}

function getOrder() {
    try {
        return JSON.parse(localStorage.getItem(ORDER_STORAGE_KEY) || "null");
    } catch (error) {
        return null;
    }
}

function renderSuccess() {
    localStorage.removeItem(CART_STORAGE_KEY);
    const order = getOrder();

    if (!order) {
        document.querySelector("#success-title").textContent = "Order Information Unavailable";
        document.querySelector(".success-label").textContent = "No completed order found";
        document.querySelector(".success-message").textContent = "Start a new domain search and complete the demonstration payment flow to generate an order confirmation.";
        return;
    }

    const domains = Array.isArray(order.domains) ? order.domains : [];
    const domainNames = domains.map((item) => item.domain).filter(Boolean);
    document.querySelector("#success-domain").innerHTML = domainNames.length
        ? domainNames.map((domain) => escapeHtml(domain)).join("<br>")
        : "Information unavailable";
    document.querySelector("#success-reference").textContent = order.reference || "Information unavailable";
    document.querySelector("#success-amount").textContent = typeof order.amount === "number"
        ? `$${order.amount} ${order.currency || "USD"}`
        : "Information unavailable";
    document.querySelector("#success-method").textContent = order.paymentMethod || "Information unavailable";

    if (order.purchaseDate) {
        const date = new Date(order.purchaseDate);
        document.querySelector("#success-date").textContent = isNaN(date.getTime())
            ? "Information unavailable"
            : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
    }
}

function returnHome(event) {
    event.preventDefault();
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(ORDER_STORAGE_KEY);
    window.location.href = "index.html";
}

document.querySelector("#back-home")?.addEventListener("click", returnHome);
renderSuccess();
