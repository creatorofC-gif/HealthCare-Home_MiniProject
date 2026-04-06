function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
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
    const nameField = document.querySelector("input[name='name']");
    const emailField = document.querySelector("input[name='email']");
    const phoneField = document.querySelector("input[name='phone']");

    if(nameField) nameField.value = getCookie("name") || "";
    if(emailField) emailField.value = getCookie("email") || "";
    if(phoneField) phoneField.value = getCookie("phone") || "";
});

const BookingForm = document.querySelector(".booking-form");

if (BookingForm) {
    BookingForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const data = Object.fromEntries(new FormData(BookingForm));

        const userId = getCookie("user_id");
        if(!userId){
            alert("Please log in to book a service."); //Will be replaced by redirect to login page later
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
                alert("✅ Booking Confirmed!");
                setCookie("name", data.name);
                setCookie("email", data.email);
                setCookie("phone", data.phone);
                
                BookingForm.reset();
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