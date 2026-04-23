
/* Cookie helpers  */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return '';
}

function setCookie(name, value, days = 7) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/`;
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
}

/* Session */
function getUserId() {
    if (window.AppSession) {
        const u = window.AppSession.get('user');
        if (u && u.id) return u.id;
    }
    const fromCookie = getCookie('user_id');
    if (fromCookie) return fromCookie;
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    return stored ? stored.id : null;
}

/*  API  */
function getApiBaseUrl() {
    const { protocol, origin } = window.location;
    if (protocol === 'file:') return 'http://localhost:5000';
    if (origin.includes('127.0.0.1') || origin.includes('localhost')) return 'http://localhost:5000';
    return origin;
}

async function fetchJson(url, options = {}) {
    const response = await fetch(`${getApiBaseUrl()}${url}`, options);
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
        ? await response.json()
        : { error: 'Server did not return JSON' };

    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
}

/* UI helpers */
function setMessage(el, text, type /* 'success' | 'error' | '' */) {
    if (!el) return;
    el.textContent = text;
    el.className = `message${type === 'success' ? ' msg-success' : type === 'error' ? ' msg-error' : ''}`;
}

function setSaveLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Saving…' : 'Save Changes';
}

/*Render helpers */
function hydrateProfile(user) {
    const welcomeEl = document.getElementById('welcome-name');
    if (welcomeEl) welcomeEl.textContent = `Welcome, ${user.name || 'User'}`;

    const nameEl  = document.getElementById('account-name');
    const emailEl = document.getElementById('account-email');
    const phoneEl = document.getElementById('account-phone');

    if (nameEl)  nameEl.value  = user.name  || '';
    if (emailEl) emailEl.value = user.email || '';
    if (phoneEl) phoneEl.value = user.phone || '';

    /* keep session cookies fresh */
    setCookie('name',  user.name  || '');
    setCookie('email', user.email || '');
    setCookie('phone', user.phone || '');
    if (window.AppSession) {
        window.AppSession.set('user', user);
    } else {
        localStorage.setItem('user', JSON.stringify(user));
    }
}

function renderHistory(history) {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    if (!history || history.length === 0) {
        historyList.innerHTML = '<p class="empty-state">No bookings found yet. Your confirmed orders will appear here.</p>';
        return;
    }

    historyList.innerHTML = history.map((item) => `
        <article class="history-item">
            <h3>Booking #${item.booking_id}</h3>
            <div class="history-meta">
                <span>Service ID: ${item.service_id ?? '—'}</span>
                <span>Date: ${item.date ?? '—'}</span>
                <span>Time: ${item.time ?? '—'}</span>
                <span>Amount: ${item.amount ? `Rs. ${item.amount}` : 'Pending payment'}</span>
            </div>
            <div class="status-row">
                <span class="pill booking">Booking: ${item.booking_status || 'pending'}</span>
                <span class="pill payment">Payment: ${item.payment_status || 'pending'}</span>
            </div>
        </article>
    `).join('');
}

/* Load account page*/
async function loadAccountPage() {
    const userId = getUserId();

    if (!userId) {
        /* Not logged in — send to login */
        window.location.replace('login.html');
        return;
    }

    try {
        const [profileRes, historyRes] = await Promise.all([
            fetchJson(`/users/${userId}`),
            fetchJson(`/users/${userId}/history`),
        ]);

        hydrateProfile(profileRes.user);
        renderHistory(historyRes.history);
    } catch (error) {
        const message = document.getElementById('account-message');
        setMessage(message, `Error loading account: ${error.message}`, 'error');

        /* If user not found on server, clear stale session */
        if (error.message === 'User not found') {
            clearSession();
            setTimeout(() => { window.location.replace('login.html'); }, 1500);
        }
    }
}

/* Bootstrap  */
document.addEventListener('DOMContentLoaded', () => {
    /* Load data — nav.js handles logout globally */
    loadAccountPage();

    /* Save profile form */
    const accountForm = document.getElementById('account-form');
    const message     = document.getElementById('account-message');
    const saveBtn     = document.getElementById('save-btn');

    if (!accountForm) return;

    accountForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const userId  = getUserId();
        const formData = Object.fromEntries(new FormData(accountForm));

        setMessage(message, 'Saving changes…', 'success');
        setSaveLoading(saveBtn, true);

        try {
            const { user, message: successMessage } = await fetchJson(`/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            hydrateProfile(user);

            /* Clear the password field after successful save */
            const pwdField = document.getElementById('account-password');
            if (pwdField) pwdField.value = '';

            setMessage(message, successMessage || 'Profile updated successfully!', 'success');
        } catch (error) {
            setMessage(message, error.message, 'error');
        } finally {
            setSaveLoading(saveBtn, false);
        }
    });
});
