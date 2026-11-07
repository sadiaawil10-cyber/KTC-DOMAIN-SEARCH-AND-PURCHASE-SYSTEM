// ==============================
// API CONFIGURATION
// Keep this for frontend learning projects only. In production, proxy API calls through a secure backend.
// ==============================
const DOMAIN_LOOKUP_API_KEY = "dlk_WYuzU8YdltBOYYInAFavDA7T8YEN7xWF";
const DOMAIN_LOOKUP_API_URL = "https://domainlookup.dev/api/suggest";
const SEARCH_TLDS = ["so", "com", "ai", "org", "net"];

// DEMONSTRATION PRICES ONLY. Replace with verified registrar prices before production.
const DEMO_ANNUAL_PRICES_USD = Object.freeze({
    "so": 45,
    "com": 15,
    "ai": 80,
    "org": 18,
    "net": 17
});

const searchForm = document.querySelector("#domain-search-form");
const domainInput = document.querySelector("#domain-input");
const searchButton = document.querySelector("#search-button");
const resultsList = document.querySelector("#results-list");
const resultCount = document.querySelector("#result-count");
const resultsTitle = document.querySelector("#results-title");
const filterButtons = document.querySelectorAll("[data-filter]");

let currentResults = [];
let activeFilter = "all";
let isSearching = false;

const CART_STORAGE_KEY = "magacnetCart";

function getCart() {
    try {
        const cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
        return Array.isArray(cart) ? cart : [];
    } catch (error) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const countElement = document.querySelector("#cart-count");
    if (countElement) countElement.textContent = String(getCart().length);
}

function isInCart(domain) {
    return getCart().some((item) => item.domain === domain);
}

function showToast(message) {
    const toast = document.querySelector("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    toast.setAttribute("aria-hidden", "false");
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => {
        toast.classList.remove("visible");
        toast.setAttribute("aria-hidden", "true");
    }, 2600);
}

function addToCart(item) {
    if (item.available !== true) return;
    const cart = getCart();
    if (cart.some((cartItem) => cartItem.domain === item.domain)) {
        showToast(`${item.domain} is already in your cart.`);
        return;
    }

    const extension = getExtension(item.domain).replace(".", "");
    const demonstrationPrice = DEMO_ANNUAL_PRICES_USD[extension] ?? null;
    cart.push({
        domain: item.domain,
        available: true,
        status: item.status || "available",
        extension: getExtension(item.domain),
        source: item.source || null,
        demonstrationPrice,
        currency: demonstrationPrice === null ? null : "USD",
        billingPeriod: demonstrationPrice === null ? null : "year"
    });
    saveCart(cart);
    displayResults(currentResults, validateDomain(domainInput.value).name || "domain");
    const modalAddButton = document.querySelector("[data-modal-add]");
    if (modalAddButton && modalAddButton.dataset.modalAdd === item.domain) {
        modalAddButton.textContent = "Added to Cart";
        modalAddButton.disabled = true;
    }
    showToast(`${item.domain} added to cart.`);
}

function showDomainDetails(item) {
    const modal = document.querySelector("#domain-modal");
    const content = document.querySelector("#modal-content");
    if (!modal || !content) return;

    const available = item.available === true;
    const statusLabel = available ? "Available" : item.status === "registered" || item.available === false ? "Unavailable" : "Unknown";
    const statusClass = available ? "available" : statusLabel === "Unavailable" ? "unavailable" : "unknown";

    content.innerHTML = `
        <p class="modal-eyebrow">Domain details</p>
        <h2 id="modal-domain-name">${escapeHtml(item.domain || "Domain")}</h2>
        <div class="modal-status-row"><span class="status ${statusClass}">${statusLabel}</span><span>${escapeHtml(getExtension(item.domain || ""))}</span></div>
        <dl class="details-grid">
            <div><dt>Registration price</dt><dd>${getDemoPriceLabel(item.domain, available)}</dd></div>
            <div><dt>Annual renewal price</dt><dd>${available ? "Information not available" : "Not applicable while unavailable"}</dd></div>
            <div><dt>Registrar or provider</dt><dd>Information not available from the API</dd></div>
            <div><dt>Registration conditions</dt><dd>${available ? "Availability is live, but the registrar must confirm eligibility and final pricing." : "This domain cannot currently be purchased through the available provider."}</dd></div>
            <div><dt>Where to purchase</dt><dd>Information not available from the API</dd></div>
            <div><dt>API source</dt><dd>${escapeHtml(item.source ? item.source.toUpperCase() : "Information not available")}</dd></div>
            <div><dt>API note</dt><dd>${escapeHtml(item.note || "No additional note provided")}</dd></div>
        </dl>
        ${available ? `<button class="modal-cart-button" type="button" data-modal-add="${escapeHtml(item.domain)}">${isInCart(item.domain) ? "Added to Cart" : "Add to Cart"}</button>` : ""}`;

    modal.hidden = false;
    document.body.classList.add("modal-open");

    const addButton = content.querySelector("[data-modal-add]");
    if (addButton) {
        addButton.disabled = isInCart(item.domain);
        addButton.addEventListener("click", () => addToCart(item));
    }
    document.querySelector("#modal-close")?.focus();
}

function closeDomainDetails() {
    document.querySelector("#domain-modal")?.setAttribute("hidden", "");
    document.body.classList.remove("modal-open");
}

function validateDomain(value) {
    const cleaned = value.trim().toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/[^a-z0-9.-]/g, "");

    if (!cleaned) return { valid: false, message: "Enter a domain name to begin your search." };

    const name = cleaned.split(".")[0];
    if (!/^[a-z0-9][a-z0-9-]{0,62}$/i.test(name)) {
        return { valid: false, message: "Use a valid domain name containing letters, numbers, or hyphens." };
    }

    if (name.length < 2) return { valid: false, message: "Enter at least two characters for the domain name." };
    return { valid: true, name, cleaned };
}

async function fetchDomainResults(name) {
    const url = new URL(DOMAIN_LOOKUP_API_URL);
    url.searchParams.set("name", name);
    url.searchParams.set("tlds", SEARCH_TLDS.join(","));

    const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${DOMAIN_LOOKUP_API_KEY}` },
    });

    let data;
    try {
        data = await response.json();
    } catch (error) {
        throw new Error("The API returned an invalid response. Please try again.");
    }

    if (!response.ok || !data.ok) {
        if (response.status === 401) throw new Error("The API key is missing or invalid.");
        if (response.status === 429) throw new Error("The search limit was reached. Please wait and try again.");
        throw new Error(data.error || "The domain search could not be completed.");
    }

    return Array.isArray(data.results) ? data.results : [];
}

function showLoading(name) {
    resultsTitle.innerHTML = `Searching <span>'${name}'</span>`;
    resultCount.textContent = "Searching";
    resultsList.innerHTML = `
        <div class="results-state" role="status">
            <span class="loading-spinner" aria-hidden="true"></span>
            <strong>Checking domain availability</strong>
            <span>Searching ${name} across ${SEARCH_TLDS.length} extensions...</span>
        </div>`;
}

function showError(message) {
    resultCount.textContent = "Search error";
    resultsList.innerHTML = `
        <div class="results-state error-state" role="alert">
            <strong>Unable to complete the search</strong>
            <span>${escapeHtml(message)}</span>
        </div>`;
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

function getDemoPrice(domain, available) {
    if (!available) return null;
    const extension = getExtension(domain).replace(".", "");
    return DEMO_ANNUAL_PRICES_USD[extension] ?? null;
}

function getDemoPriceLabel(domain, available) {
    const price = getDemoPrice(domain, available);
    return price === null ? "Unavailable" : `$${price} USD / year (demonstration price)`;
}

function displayResults(results, name) {
    currentResults = results;
    resultsTitle.innerHTML = `Search Results for <span>'${escapeHtml(name)}'</span>`;

    const filteredResults = activeFilter === "available"
        ? results.filter((item) => item.available === true)
        : results;

    resultCount.textContent = `${filteredResults.length} Result${filteredResults.length === 1 ? "" : "s"}`;

    if (!filteredResults.length) {
        resultsList.innerHTML = `
            <div class="results-state">
                <strong>No domains matched this filter</strong>
                <span>Try showing all extensions or search another name.</span>
            </div>`;
        return;
    }

    const returnedTlds = new Set(results.map((item) => getExtension(item.domain).replace(".", "")));
    const missingTlds = SEARCH_TLDS.filter((tld) => !returnedTlds.has(tld));

    resultsList.innerHTML = filteredResults.map((item, index) => {
        const domain = String(item.domain || "");
        const extension = getExtension(domain);
        const status = String(item.status || "unknown");
        const available = item.available === true;
        const unavailable = status === "registered" || item.available === false;
        const statusLabel = available ? "Available" : unavailable ? "Unavailable" : "Unknown";
        const statusClass = available ? "available" : unavailable ? "unavailable" : "unknown";
        const sourceText = item.source ? `Source: ${escapeHtml(item.source.toUpperCase())}` : "Registry source unavailable";
        const inCart = available && isInCart(domain);

        return `
            <article class="domain-result ${available && index === 0 ? "featured" : ""}" data-domain="${escapeHtml(domain)}">
                <div class="extension-box">${escapeHtml(extension)}</div>
                <div class="domain-info">
                    <div class="domain-name-row">
                        <h3>${escapeHtml(domain)}</h3>
                        <span class="status ${statusClass}">${statusLabel}</span>
                    </div>
                    <p>${sourceText}</p>
                </div>
                <div class="domain-price">
                    <strong>${available ? `$${getDemoPrice(domain, available)} USD` : statusLabel}</strong>
                    <span>${available ? "per year, demonstration price" : "Registry result"}</span>
                </div>
                <div class="result-actions">
                    <button class="details-action" type="button" data-details="${escapeHtml(domain)}">View Details</button>
                    ${available ? `<button class="cart-action" type="button" data-add-cart="${escapeHtml(domain)}" ${inCart ? "disabled" : ""}>${inCart ? "Added to Cart" : "Add to Cart"}</button>` : ""}
                </div>
            </article>`;
    }).join("") + (activeFilter === "all" && missingTlds.length
        ? missingTlds.map((tld) => `
            <div class="results-state unsupported-extension">
                <strong>.${escapeHtml(tld)} was not returned by the API</strong>
                <span>It was requested but not checked successfully, so no availability is shown.</span>
            </div>`).join("")
        : "");

    const totalResultCount = filteredResults.length;
    resultCount.textContent = `${totalResultCount} Result${totalResultCount === 1 ? "" : "s"}`;

    resultsList.querySelectorAll("[data-details]").forEach((button) => {
        button.addEventListener("click", () => {
            const item = currentResults.find((result) => result.domain === button.dataset.details);
            if (item) showDomainDetails(item);
        });
    });

    resultsList.querySelectorAll("[data-add-cart]").forEach((button) => {
        button.addEventListener("click", () => {
            const item = currentResults.find((result) => result.domain === button.dataset.addCart);
            if (item) addToCart(item);
        });
    });
}

async function searchDomain() {
    if (isSearching) return;

    const validation = validateDomain(domainInput.value);
    if (!validation.valid) {
        showError(validation.message);
        resultsTitle.textContent = "Search Results";
        domainInput.focus();
        return;
    }

    isSearching = true;
    searchButton.disabled = true;
    searchButton.classList.add("loading");
    searchButton.querySelector("span").textContent = "Searching";
    showLoading(validation.name);

    try {
        const results = await fetchDomainResults(validation.name);
        displayResults(results, validation.name);
    } catch (error) {
        showError(error.message);
    } finally {
        isSearching = false;
        searchButton.disabled = false;
        searchButton.classList.remove("loading");
        searchButton.querySelector("span").textContent = "Search Domain";
    }
}

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    searchDomain();
});

domainInput.addEventListener("input", () => {
    domainInput.closest(".domain-search").classList.remove("input-error");
});

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        filterButtons.forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        activeFilter = button.dataset.filter;

        const titleName = resultsTitle.querySelector("span")?.textContent.replace(/[']/g, "")
            || validateDomain(domainInput.value).name || "domain";
        displayResults(currentResults, titleName);
    });
});

document.querySelector("#modal-close")?.addEventListener("click", closeDomainDetails);
document.querySelector("#domain-modal")?.addEventListener("click", (event) => {
    if (event.target.id === "domain-modal") closeDomainDetails();
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDomainDetails();
});
window.addEventListener("storage", updateCartCount);
updateCartCount();

document.querySelectorAll(".popular-domains button").forEach((button) => {
    button.addEventListener("click", () => {
        const current = validateDomain(domainInput.value);
        const name = current.valid ? current.name : "magacnet";
        domainInput.value = name;
        domainInput.focus();
        searchDomain();
    });
});
