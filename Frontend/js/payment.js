const basePrice = 500;

const totalEl = document.getElementById("total-price");
const cartPreview = document.getElementById("cart-preview");
const summary = window.AppSession ? window.AppSession.get("booking_summary") || {} : JSON.parse(localStorage.getItem("booking_summary") || "{}");

const serviceNameEl = document.getElementById("service-name");
const serviceDateEl = document.getElementById("service-date");
const serviceTimeEl = document.getElementById("service-time");


let cart = window.AppSession ? window.AppSession.get("cart") || [] : JSON.parse(localStorage.getItem("cart")) || [];

if (serviceNameEl) {
    serviceNameEl.innerText = summary.service || "Selected Service";
}

if (serviceDateEl) {
    serviceDateEl.innerText = summary.date || "-";
}

if (serviceTimeEl) {
    serviceTimeEl.innerText = summary.time || "-";
}

//calculate cart total
function getCartTotal() {
    let total = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
    });
    return total;
}

//show the cart
function renderCartPreview() {
    if (cart.length === 0) {
        cartPreview.innerHTML = "<p>No products added</p>";
        return;
    }

    let html = "<strong>Added Products:</strong><br>";

    cart.forEach(item => {
        html += `${item.name} (x${item.quantity}) - ₹${item.price}<br>`;
    });

    cartPreview.innerHTML = html;
}

//update the total
function updateTotal() {
    const total = basePrice + getCartTotal();
    totalEl.innerText = total;
}


renderCartPreview();
updateTotal();


document.getElementById("add-product-btn").addEventListener("click", () => {
    window.location.href = "products.html";
});

// modals for good looks
const modal = document.getElementById("success-modal");
const closeBtn = document.getElementById("close-modal");

//payment logic
document.getElementById("payment-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const finalAmount = basePrice + getCartTotal();

    const paymentData = {
        booking_id: window.AppSession ? window.AppSession.get("booking_id") : localStorage.getItem("booking_id"),
        amount: finalAmount,
        items: cart
    };

    try {
        const res = await fetch("http://localhost:5000/payment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(paymentData)
        });

        if (res.ok) {
            modal.style.display = "flex";
            if (window.AppSession) {
                window.AppSession.remove("cart");
                window.AppSession.remove("booking_id");
                window.AppSession.remove("booking_summary");
            } else {
                localStorage.removeItem("cart");
                localStorage.removeItem("booking_id");
                localStorage.removeItem("booking_summary");
            }
        } else {
            alert("Payment Failed");
        }

    } catch (err) {
        alert("Server error");
    }
});

closeBtn.addEventListener("click", () => {
    window.location.href = "index.html";
});
