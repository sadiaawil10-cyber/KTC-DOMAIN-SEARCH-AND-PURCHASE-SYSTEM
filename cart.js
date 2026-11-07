const CART_STORAGE_KEY = "magacnetCart";

function getCart() {
    try {
        const cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
        return Array.isArray(cart) ? cart.filter((item) => item && item.available === true && item.domain) : [];
    } catch (error) {
        return [];
    }
}

function escapeHtml(value) {
    const element = document.createElement("span");
    element.textContent = value;
    return element.innerHTML;
}

function getExtension(domain) {
    const parts = String(domain).split(".");
    return parts.length > 1 ? `.${parts.at(-1)}` : "Domain";
}

function updateCartCount() {
    const cart = getCart();
    const count = cart.length;
    const countElement = document.querySelector("#cart-count");
    const summaryCount = document.querySelector("#summary-count");
    const subtotalAmount = document.querySelector("#subtotal-amount");
    const totalAmount = document.querySelector("#total-amount");
    const subtotal = cart.reduce((total, item) => total + (Number(item.demonstrationPrice) || 0), 0);
    if (countElement) countElement.textContent = String(count);
    if (summaryCount) summaryCount.textContent = String(count);
    if (subtotalAmount) subtotalAmount.textContent = `$${subtotal} USD`;
    if (totalAmount) totalAmount.textContent = `$${subtotal} USD`;
}

function removeFromCart(domain) {
    const cart = getCart().filter((item) => item.domain !== domain);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartCount();
    renderCart();
}

function renderCart() {
    const cart = getCart();
    const list = document.querySelector("#cart-items-list");
    updateCartCount();

    if (!cart.length) {
        list.innerHTML = `
            <div class="empty-cart">
                <div class="empty-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><circle cx="9" cy="20" r="1.25"/><circle cx="19" cy="20" r="1.25"/><path d="M3 4h2l2.5 10.2a2 2 0 0 0 2 1.5h7.8a2 2 0 0 0 2-1.6L21 7H6"/></svg>
                </div>
                <h3>Your cart is empty</h3>
                <p>Search for an available domain to start your registration.</p>
                <a href="index.html#results">Search Domains</a>
            </div>`;
        return;
    }

    list.innerHTML = cart.map((item) => `
        <article class="cart-item">
            <div class="extension-box">${escapeHtml(item.extension || getExtension(item.domain))}</div>
            <div class="cart-domain">
                <h3>${escapeHtml(item.domain)}</h3>
                <span class="status">Available</span>
            </div>
            <div class="price-info">
                <strong>${item.demonstrationPrice == null ? "Price needs confirmation" : `$${Number(item.demonstrationPrice)} USD / year`}</strong>
                <span>Demonstration price</span>
                <span>Quantity: 1</span>
            </div>
            <button class="remove-button" type="button" data-remove-domain="${escapeHtml(item.domain)}">Remove</button>
        </article>`).join("");

    list.querySelectorAll("[data-remove-domain]").forEach((button) => {
        button.addEventListener("click", () => removeFromCart(button.dataset.removeDomain));
    });
}

window.addEventListener("storage", renderCart);
renderCart();
