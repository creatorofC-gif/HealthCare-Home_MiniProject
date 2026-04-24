
/* Cookie helpers  */
function setCookie(name, value, days = 7) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/`;
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return '';
}

function clearSession() {
    if (window.AppSession) {
        window.AppSession.clearUser();
        return;
    }
    ['user_id', 'name', 'email', 'phone'].forEach(k => {
        document.cookie = `${k}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    });
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
}

/*Session helpers  */
function saveUserSession(user) {
    if (!user) return;
    setCookie('user_id', user.id);
    setCookie('name',    user.name  || '');
    setCookie('email',   user.email || '');
    setCookie('phone',   user.phone || '');
    if (window.AppSession) {
        window.AppSession.set('user', user);
    } else {
        localStorage.setItem('user', JSON.stringify(user));
    }
}

function isLoggedIn() {
    if (window.AppSession) return window.AppSession.isLoggedIn();
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    return !!getCookie('user_id') || !!(storedUser && storedUser.id);
}

/* API helpers  */
function getApiBaseUrl() {
    const { protocol, origin } = window.location;
    if (protocol === 'file:') return 'http://localhost:5000';
    if (origin.includes('127.0.0.1') || origin.includes('localhost')) return 'http://localhost:5000';
    return origin;
}

async function postJson(endpoint, payload) {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const contentType = response.headers.get('content-type') || '';
    const result = contentType.includes('application/json')
        ? await response.json()
        : { error: 'Server did not return JSON' };

    if (!response.ok) throw new Error(result.error || 'Request failed');
    return result;
}

/* UI helpers*/
function setMessage(el, text, type /* 'success' | 'error' */) {
    if (!el) return;
    el.textContent = text;
    el.className = type === 'success' ? 'msg-success' : 'msg-error';
}

function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Please wait…' : btn.dataset.label;
}

/* Main logic */
document.addEventListener('DOMContentLoaded', () => {

    /* If user is already logged-in, redirect away from auth pages */
    if (isLoggedIn()) {
        window.location.replace('account.html');
        return;
    }

    /* LOGIN */
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const loginMessage = document.getElementById('loginMessage');
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) loginBtn.dataset.label = loginBtn.textContent;

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = Object.fromEntries(new FormData(loginForm));

            setMessage(loginMessage, 'Signing in…', 'success');
            setLoading(loginBtn, true);

            try {
                const result = await postJson('/login', formData);
                saveUserSession(result.user);
                setMessage(loginMessage, result.message || 'Login successful!', 'success');

                /* brief pause so the user sees the success message */
                setTimeout(() => { window.location.href = 'account.html'; }, 600);
            } catch (error) {
                setMessage(loginMessage, error.message, 'error');
                setLoading(loginBtn, false);
            }
        });
    }

    /* REGISTER */
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const message    = document.getElementById('message');
        const registerBtn = document.getElementById('register-btn');
        if (registerBtn) registerBtn.dataset.label = registerBtn.textContent;

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = Object.fromEntries(new FormData(registerForm));

            setMessage(message, 'Creating account…', 'success');
            setLoading(registerBtn, true);

            try {
                const result = await postJson('/register', formData);
               
                saveUserSession(result.user);
                setMessage(message, 'Account created! Redirecting…', 'success');

                setTimeout(() => { window.location.href = 'account.html'; }, 800);
            } catch (error) {
                setMessage(message, error.message, 'error');
                setLoading(registerBtn, false);
            }
        });
    }
});
