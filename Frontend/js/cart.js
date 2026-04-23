window.cart = window.AppSession ? window.AppSession.get("cart") || [] : JSON.parse(localStorage.getItem("cart")) || [];

window.saveCart = function(){
    if (window.AppSession) {
        window.AppSession.set("cart", cart);
    } else {
        localStorage.setItem("cart", JSON.stringify(cart));
    }
}
window.removeItem = function(index){
    cart.splice(index, 1);
    saveCart();
    renderCart();
}

window.renderCart = function(){
    const cartItems = document.getElementById("cart-items");
    const emptyCart = document.getElementById("empty-cart");
    const totalDisplay = document.getElementById("cart-total");

    if(!cartItems) return;

    cartItems.innerHTML = "";

    if(cart.length === 0){
        emptyCart.style.display = "block";
        totalDisplay.innerText = "0";
        return;
    }
    emptyCart.style.display = "none";
    let total = 0;
    cart.forEach((item, index) => {
        total += item.price * item.quantity;
        
        const div = document.createElement("div");
        div.classList.add("cart-item");
            div.innerHTML = `
            <div class="cart-item-info">
                <img src="${item.image}" alt="${item.name}">
                <div>
                    <h4>${item.name}</h4>
                    <p>₹${item.price}</p>
                </div>
            </div>

            <div class="cart-item-actions">
                <p>Qty: ${item.quantity}</p>
                <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
            </div>
        `;
        cartItems.appendChild(div);
    });
    totalDisplay.innerText = total; 
}
