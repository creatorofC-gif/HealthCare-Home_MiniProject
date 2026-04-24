# HealAtHome

HealAtHome is a web application designed to facilitate home healthcare services. It allows users to browse available medical services, book appointments, and manage their healthcare needs from the comfort of their home.

## Table of Contents
- [Features](#features)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
- [Usage](#usage)

## Features

- **User Authentication**: Secure login and registration functionality with session persistence across the application.
- **Service Browsing**: A comprehensive catalog of healthcare services available for home booking.
- **Booking System**: Select and add desired healthcare services to a shopping cart for streamlined checkout.
- **Account Management**: A dedicated user dashboard to review past bookings.
- **Payment Tracking**: Distinction between confirmed and unconfirmed bookings, with the ability to complete pending payments directly from the account dashboard.
- **Cart Management**: Persistent cart state tied to user sessions, ensuring data privacy across different accounts.

## Project Structure

The project is structured into Frontend and Backend components. The current implementation emphasizes the Frontend architecture.

### Frontend
- **HTML**: Core structural files for each page (e.g., `index.html`, `login.html`, `booking.html`, `account.html`).
- **CSS**: Dedicated stylesheets for modular styling (e.g., `style.css`, `auth.css`, `booking.css`, `cart.css`).
- **JavaScript**: Client-side logic for authentication, cart management, and booking workflows located in the `js/` directory.

## Technologies Used

- HTML5
- CSS3 (Vanilla)
- JavaScript (ES6+)

## Getting Started

To run the application locally, follow these steps:

1. Clone the repository to your local machine.
2. Navigate to the project directory.
3. Open the `Frontend` directory.
4. Launch `index.html` in your preferred web browser.

Alternatively, you can use a local development server such as Live Server (available as an extension in VS Code) to serve the project files.

## Usage

1. **Sign Up / Log In**: Create a new account or log into an existing one to access the full features of the application. Unauthenticated users attempting to book a service will be redirected to the login page.
2. **Explore Services**: Navigate to the services or products section to view available home healthcare options.
3. **Book a Service**: Add desired services to your cart.
4. **Checkout**: Proceed to the cart to review your selected services and finalize the booking.
5. **Manage Account**: Access the account dashboard to view previous bookings, check payment statuses, and log out.