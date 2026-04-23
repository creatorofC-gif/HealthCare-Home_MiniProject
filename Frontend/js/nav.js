(function () {
    window.AppSession = {
        _getState: function() {
            let state = {};
            try {
                if (window.name && window.name.startsWith('HealApp_')) {
                    state = JSON.parse(window.name.substring(8));
                }
            } catch(e){}
            return state;
        },
        _setState: function(state) {
            try { window.name = 'HealApp_' + JSON.stringify(state); } catch(e){}
        },
        get: function(key) {
            let val = null;
            try { 
                const local = localStorage.getItem(key);
                if (local) val = JSON.parse(local); 
            } catch(e){}
            
            if (val === null) {
                val = this._getState()[key];
            }
            return val;
        },
        set: function(key, val) {
            try { localStorage.setItem(key, JSON.stringify(val)); } catch(e){}
            let state = this._getState();
            state[key] = val;
            this._setState(state);
        },
        remove: function(key) {
            try { localStorage.removeItem(key); } catch(e){}
            let state = this._getState();
            delete state[key];
            this._setState(state);
        },
        clearUser: function() {
            this.remove('user');
            ['user_id', 'name', 'email', 'phone'].forEach(k => {
                document.cookie = `${k}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
            });
        },
        isLoggedIn: function() {
            const u = this.get('user');
            // Check cookie too just in case
            const hasCookie = document.cookie.includes('user_id=');
            return !!(u && u.id) || hasCookie;
        }
    };

    const path = window.location.pathname;
    const isAuthPage = path.endsWith('login.html') || path.endsWith('register.html') || path.endsWith('signup.html');
    
    // Redirect unauthenticated users
    if (!AppSession.isLoggedIn() && !isAuthPage) {
        window.location.replace('login.html');
        return; // stop execution
    }

    document.addEventListener('DOMContentLoaded', () => {
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) return;

        const loggedIn = AppSession.isLoggedIn();

        navLinks.querySelectorAll('a[href="login.html"], a[href="register.html"]').forEach(a => {
            a.closest('li').remove();
        });

        navLinks.querySelectorAll('a[href="account.html"]').forEach(a => {
            a.closest('li').remove();
        });

        const existingLogout = navLinks.querySelector('#nav-logout-btn');
        if (existingLogout) existingLogout.closest('li').remove();

        if (loggedIn) {
            const accountItem = document.createElement('li');
            const accountLink = document.createElement('a');
            accountLink.href = 'account.html';
            accountLink.textContent = 'Account';
            if (path.endsWith('account.html')) accountLink.classList.add('active');
            accountItem.appendChild(accountLink);
            navLinks.appendChild(accountItem);

            const logoutItem = document.createElement('li');
            const logoutBtn  = document.createElement('button');
            logoutBtn.id = 'nav-logout-btn';
            logoutBtn.className = 'btn-nav-logout';
            logoutBtn.type = 'button';
            logoutBtn.textContent = 'Logout';
            logoutBtn.addEventListener('click', () => {
                AppSession.clearUser();
                window.location.href = 'login.html';
            });
            logoutItem.appendChild(logoutBtn);
            navLinks.appendChild(logoutItem);
        } else {
            const loginItem = document.createElement('li');
            const loginLink = document.createElement('a');
            loginLink.href = 'login.html';
            loginLink.textContent = 'Login';
            if (path.endsWith('login.html')) loginLink.classList.add('active');
            loginItem.appendChild(loginLink);
            navLinks.appendChild(loginItem);

            const regItem = document.createElement('li');
            const regLink = document.createElement('a');
            regLink.href = 'register.html';
            regLink.textContent = 'Register';
            if (path.endsWith('register.html')) regLink.classList.add('active');
            regItem.appendChild(regLink);
            navLinks.appendChild(regItem);
        }
    });
})();
