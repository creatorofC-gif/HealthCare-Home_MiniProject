function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return '';
}

function setCookie(name, value, days=7 ) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = `${name}=${value}${expires}; path=/`;
}

window.addEventListener("DOMContentLoaded", () => {
    const nameField  = document.querySelector("input[name='name']");
    const emailField = document.querySelector("input[name='email']");
    const phoneField = document.querySelector("input[name='phone']");

    // Read from cookies first; fall back to AppSession user object
    const stored = window.AppSession ? window.AppSession.get('user') : JSON.parse(localStorage.getItem('user') || 'null');

    if (nameField)  nameField.value  = getCookie('name')  || (stored && stored.name)  || '';
    if (emailField) emailField.value = getCookie('email') || (stored && stored.email) || '';
    if (phoneField) phoneField.value = getCookie('phone') || (stored && stored.phone) || '';
});

const BookingForm = document.querySelector(".booking-form");

if (BookingForm) {
    BookingForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const data = Object.fromEntries(new FormData(BookingForm));

        const storedUser = window.AppSession ? window.AppSession.get('user') : JSON.parse(localStorage.getItem('user') || 'null');
        const userId = getCookie("user_id") || (storedUser && storedUser.id);
        if(!userId){
            alert("Please log in to book a service."); 
            return;
        }
        try {
            // STEP 1: Map frontend data → backend format
            const requestBody = {
                user_id: userId, 
                service_id: getServiceId(data.service),
                date: data.date,
                time: data.time
            };

            // STEP 2: Send to backend
            const response = await fetch("http://localhost:5000/book", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem("booking_id", result.booking.id);
                localStorage.setItem("booking_summary", JSON.stringify({
                    service: data.service,
                    date: data.date,
                    time: data.time
                }));

                const serviceItem = {
                    name: "Service: " + data.service,
                    price: 500, // you can make dynamic later
                    quantity: 1,
                    image: "images/service.png", // optional placeholder
                    type: "service"
                };
            
                let cart = window.AppSession ? window.AppSession.get("cart") : JSON.parse(localStorage.getItem("cart"));
                if (!cart) cart = [];
            
                cart.push(serviceItem);
            
                if (window.AppSession) {
                    window.AppSession.set("cart", cart);
                } else {
                    localStorage.setItem("cart", JSON.stringify(cart));
                }
            
                setCookie("name", data.name);
                setCookie("email", data.email);
                setCookie("phone", data.phone);
            
                BookingForm.reset();
            
                window.location.href = "cart.html";
            } else {
                alert("❌ Booking Failed");
                console.error(result);
            }

        } catch (err) {
            console.error(err);
            alert("Server error");
        }
    });
}

function getServiceId(serviceName) {
    const services = {
        "Caretaker": 2,
        "Nurse": 3,
        "Elderly Care": 2,
        "Physiotherapy": 1,
        "Baby Care": 4
    };

    return services[serviceName] || 1;
}
