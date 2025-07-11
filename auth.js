// Authentication System for Fung's Accounting App
// Handles user registration, login, session management, and data isolation

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('app_users')) || [];
        this.sessionToken = localStorage.getItem('app_session_token');
        
        // Initialize authentication
        this.initializeAuth();
    }

    // Initialize authentication system
    initializeAuth() {
        // Check if user is logged in from previous session
        if (this.sessionToken) {
            const user = this.getUserBySessionToken(this.sessionToken);
            if (user) {
                this.currentUser = user;
                this.showMainApp();
            } else {
                this.logout();
            }
        } else {
            this.showLoginScreen();
        }
    }

    // User Registration
    async register(userData) {
        const { username, email, password, confirmPassword, fullName, businessName } = userData;

        // Validation
        const validation = this.validateRegistration(userData);
        if (!validation.isValid) {
            return { success: false, message: validation.message };
        }

        // Check if user already exists
        if (this.getUserByUsername(username) || this.getUserByEmail(email)) {
            return { success: false, message: 'Username or email already exists' };
        }

        // Create new user
        const newUser = {
            id: this.generateUserId(),
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            fullName: fullName,
            businessName: businessName || fullName + "'s Business",
            passwordHash: this.hashPassword(password),
            createdAt: new Date().toISOString(),
            lastLogin: null,
            sessionToken: null,
            profile: {
                avatar: null,
                phone: '',
                address: '',
                taxId: '',
                currency: 'USD',
                dateFormat: 'MM/DD/YYYY',
                theme: 'light'
            },
            settings: {
                autoSave: true,
                emailNotifications: true,
                twoFactorEnabled: false,
                sessionTimeout: 30 // minutes
            }
        };

        // Save user
        this.users.push(newUser);
        this.saveUsers();

        // Auto-login after registration
        return this.login({ username, password });
    }

    // User Login
    async login(credentials) {
        const { username, password } = credentials;

        // Find user by username or email
        const user = this.getUserByUsername(username) || this.getUserByEmail(username);
        
        if (!user) {
            return { success: false, message: 'Invalid username or password' };
        }

        // Verify password
        if (!this.verifyPassword(password, user.passwordHash)) {
            return { success: false, message: 'Invalid username or password' };
        }

        // Generate session token
        const sessionToken = this.generateSessionToken();
        
        // Update user session info
        user.lastLogin = new Date().toISOString();
        user.sessionToken = sessionToken;
        
        // Save updates
        this.saveUsers();
        
        // Set current user and session
        this.currentUser = user;
        localStorage.setItem('app_session_token', sessionToken);
        
        // Show main application
        this.showMainApp();
        
        return { 
            success: true, 
            message: `Welcome back, ${user.fullName}!`,
            user: this.getCurrentUserSafe()
        };
    }

    // User Logout
    logout() {
        if (this.currentUser) {
            // Clear session token from user record
            this.currentUser.sessionToken = null;
            this.saveUsers();
        }

        // Clear current session
        this.currentUser = null;
        localStorage.removeItem('app_session_token');
        
        // Clear user-specific data from memory (but keep in storage)
        this.clearUserDataFromMemory();
        
        // Show login screen
        this.showLoginScreen();
    }

    // Get current user (safe - no sensitive data)
    getCurrentUser() {
        return this.currentUser;
    }

    getCurrentUserSafe() {
        if (!this.currentUser) return null;
        
        const { passwordHash, sessionToken, ...safeUser } = this.currentUser;
        return safeUser;
    }

    // Update user profile
    updateProfile(profileData) {
        if (!this.currentUser) {
            return { success: false, message: 'Not authenticated' };
        }

        const allowedFields = ['fullName', 'businessName', 'phone', 'address', 'taxId', 'currency', 'dateFormat', 'theme'];
        
        // Update allowed profile fields
        Object.keys(profileData).forEach(key => {
            if (allowedFields.includes(key)) {
                if (key === 'fullName' || key === 'businessName') {
                    this.currentUser[key] = profileData[key];
                } else {
                    this.currentUser.profile[key] = profileData[key];
                }
            }
        });

        this.saveUsers();
        return { success: true, message: 'Profile updated successfully' };
    }

    // Change password
    changePassword(currentPassword, newPassword) {
        if (!this.currentUser) {
            return { success: false, message: 'Not authenticated' };
        }

        // Verify current password
        if (!this.verifyPassword(currentPassword, this.currentUser.passwordHash)) {
            return { success: false, message: 'Current password is incorrect' };
        }

        // Validate new password
        const validation = this.validatePassword(newPassword);
        if (!validation.isValid) {
            return { success: false, message: validation.message };
        }

        // Update password
        this.currentUser.passwordHash = this.hashPassword(newPassword);
        this.saveUsers();

        return { success: true, message: 'Password changed successfully' };
    }

    // Data Storage Management - User-specific data isolation
    getUserStorageKey(key) {
        if (!this.currentUser) return null;
        return `user_${this.currentUser.id}_${key}`;
    }

    setUserData(key, data) {
        if (!this.currentUser) return false;
        const userKey = this.getUserStorageKey(key);
        localStorage.setItem(userKey, JSON.stringify(data));
        return true;
    }

    getUserData(key, defaultValue = null) {
        if (!this.currentUser) return defaultValue;
        const userKey = this.getUserStorageKey(key);
        const data = localStorage.getItem(userKey);
        return data ? JSON.parse(data) : defaultValue;
    }

    clearUserData(key) {
        if (!this.currentUser) return false;
        const userKey = this.getUserStorageKey(key);
        localStorage.removeItem(userKey);
        return true;
    }

    clearAllUserData() {
        if (!this.currentUser) return false;
        
        // Find and remove all keys for current user
        const userPrefix = `user_${this.currentUser.id}_`;
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(userPrefix)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        return true;
    }

    clearUserDataFromMemory() {
        // This is called during logout to clear any in-memory user data
        // The accounting app will need to reload user-specific data on next login
    }

    // Helper Methods
    validateRegistration(userData) {
        const { username, email, password, confirmPassword, fullName } = userData;

        if (!username || username.length < 3) {
            return { isValid: false, message: 'Username must be at least 3 characters long' };
        }

        if (!email || !this.isValidEmail(email)) {
            return { isValid: false, message: 'Please enter a valid email address' };
        }

        if (!fullName || fullName.length < 2) {
            return { isValid: false, message: 'Please enter your full name' };
        }

        const passwordValidation = this.validatePassword(password);
        if (!passwordValidation.isValid) {
            return passwordValidation;
        }

        if (password !== confirmPassword) {
            return { isValid: false, message: 'Passwords do not match' };
        }

        return { isValid: true };
    }

    validatePassword(password) {
        if (!password || password.length < 6) {
            return { isValid: false, message: 'Password must be at least 6 characters long' };
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' };
        }

        return { isValid: true };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    getUserByUsername(username) {
        return this.users.find(user => user.username === username.toLowerCase());
    }

    getUserByEmail(email) {
        return this.users.find(user => user.email === email.toLowerCase());
    }

    getUserBySessionToken(token) {
        return this.users.find(user => user.sessionToken === token);
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateSessionToken() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
    }

    // Simple password hashing (in production, use proper bcrypt or similar)
    hashPassword(password) {
        // This is a simple hash for demo purposes
        // In production, use proper password hashing library
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36) + '_' + password.length;
    }

    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }

    saveUsers() {
        localStorage.setItem('app_users', JSON.stringify(this.users));
    }

    // UI Management
    showLoginScreen() {
        document.getElementById('loginContainer').style.display = 'block';
        document.getElementById('mainApp').style.display = 'none';
        document.body.classList.add('login-page');
    }

    showMainApp() {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        document.body.classList.remove('login-page');
        
        // Update user info in the UI
        this.updateUserInfoInUI();
        
        // Initialize or reload the accounting app with user data
        if (typeof app !== 'undefined') {
            app.loadUserData();
        }
    }

    updateUserInfoInUI() {
        if (!this.currentUser) return;

        // Update user name in navigation
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            el.textContent = this.currentUser.fullName;
        });

        // Update business name
        const businessNameElements = document.querySelectorAll('.business-name');
        businessNameElements.forEach(el => {
            el.textContent = this.currentUser.businessName;
        });

        // Update user profile in settings/profile areas
        const userEmailElements = document.querySelectorAll('.user-email');
        userEmailElements.forEach(el => {
            el.textContent = this.currentUser.email;
        });
    }

    // Session Management
    checkSession() {
        if (!this.currentUser || !this.sessionToken) {
            this.logout();
            return false;
        }

        // Check session timeout (if implemented)
        const sessionTimeout = this.currentUser.settings?.sessionTimeout || 30; // minutes
        const lastLogin = new Date(this.currentUser.lastLogin);
        const now = new Date();
        const timeDiff = (now - lastLogin) / (1000 * 60); // minutes

        if (timeDiff > sessionTimeout) {
            this.logout();
            return false;
        }

        return true;
    }

    // Session heartbeat to keep session alive
    refreshSession() {
        if (this.currentUser) {
            this.currentUser.lastLogin = new Date().toISOString();
            this.saveUsers();
        }
    }

    // Demo/Development Methods
    createDemoUser() {
        const demoUser = {
            username: 'demo',
            email: 'demo@fungacct.com',
            password: 'Demo123!',
            confirmPassword: 'Demo123!',
            fullName: 'Demo User',
            businessName: 'Demo Restaurant Business'
        };

        return this.register(demoUser);
    }

    // Admin methods for development
    getAllUsers() {
        // Only for development/admin purposes
        return this.users.map(user => {
            const { passwordHash, sessionToken, ...safeUser } = user;
            return safeUser;
        });
    }

    deleteUser(userId) {
        // Admin function to delete a user and all their data
        this.users = this.users.filter(user => user.id !== userId);
        this.saveUsers();
        
        // Remove all user data from localStorage
        const userPrefix = `user_${userId}_`;
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(userPrefix)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }
}

// Global authentication instance
let authSystem;

// Initialize auth system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    authSystem = new AuthSystem();
    
    // Set up session refresh interval (every 5 minutes)
    setInterval(() => {
        if (authSystem.currentUser) {
            authSystem.refreshSession();
        }
    }, 5 * 60 * 1000);
});

// Global authentication functions for HTML onclick events
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('forgotPasswordForm').style.display = 'none';
}

function showForgotPasswordForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'block';
}

function performLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showAuthMessage('Please enter both username and password', 'danger');
        return;
    }

    authSystem.login({ username, password }).then(result => {
        if (result.success) {
            showAuthMessage(result.message, 'success');
        } else {
            showAuthMessage(result.message, 'danger');
        }
    });
}

function performRegister() {
    const userData = {
        username: document.getElementById('registerUsername').value,
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        confirmPassword: document.getElementById('registerConfirmPassword').value,
        fullName: document.getElementById('registerFullName').value,
        businessName: document.getElementById('registerBusinessName').value
    };

    authSystem.register(userData).then(result => {
        if (result.success) {
            showAuthMessage(result.message, 'success');
        } else {
            showAuthMessage(result.message, 'danger');
        }
    });
}

function performLogout() {
    authSystem.logout();
    showAuthMessage('You have been logged out successfully', 'info');
}

function showUserProfile() {
    if (authSystem.currentUser) {
        // Show user profile modal or page
        $('#userProfileModal').modal('show');
        populateUserProfile();
    }
}

function populateUserProfile() {
    const user = authSystem.currentUser;
    if (!user) return;

    document.getElementById('profileFullName').value = user.fullName || '';
    document.getElementById('profileBusinessName').value = user.businessName || '';
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('profilePhone').value = user.profile?.phone || '';
    document.getElementById('profileAddress').value = user.profile?.address || '';
    document.getElementById('profileTaxId').value = user.profile?.taxId || '';
    document.getElementById('profileCurrency').value = user.profile?.currency || 'USD';
}

function updateUserProfile() {
    const profileData = {
        fullName: document.getElementById('profileFullName').value,
        businessName: document.getElementById('profileBusinessName').value,
        phone: document.getElementById('profilePhone').value,
        address: document.getElementById('profileAddress').value,
        taxId: document.getElementById('profileTaxId').value,
        currency: document.getElementById('profileCurrency').value
    };

    const result = authSystem.updateProfile(profileData);
    if (result.success) {
        showAuthMessage(result.message, 'success');
        authSystem.updateUserInfoInUI();
        $('#userProfileModal').modal('hide');
    } else {
        showAuthMessage(result.message, 'danger');
    }
}

function changeUserPassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (newPassword !== confirmNewPassword) {
        showAuthMessage('New passwords do not match', 'danger');
        return;
    }

    const result = authSystem.changePassword(currentPassword, newPassword);
    if (result.success) {
        showAuthMessage(result.message, 'success');
        // Clear password fields
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
    } else {
        showAuthMessage(result.message, 'danger');
    }
}

function showAuthMessage(message, type) {
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show auth-message`;
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert">
            <span>&times;</span>
        </button>
    `;

    // Find the appropriate container for the message
    const messageContainer = document.querySelector('.auth-messages') || 
                           document.querySelector('.modal-body') || 
                           document.querySelector('#loginContainer');
    
    if (messageContainer) {
        messageContainer.insertBefore(alertElement, messageContainer.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertElement.parentNode) {
                alertElement.parentNode.removeChild(alertElement);
            }
        }, 5000);
    }
}

// Demo user creation for testing
function createDemoUser() {
    authSystem.createDemoUser().then(result => {
        if (result.success) {
            showAuthMessage('Demo user created and logged in successfully!', 'success');
        } else {
            showAuthMessage(result.message, 'danger');
        }
    });
}