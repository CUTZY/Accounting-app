// Firebase Authentication and Database System for Fung's Accounting App
// Firebase Firestore cloud-based authentication and data storage system

class FirebaseAuthSystem {
    constructor() {
        this.currentUser = null;
        this.db = null;
        this.auth = null;
        this.isFirebaseReady = false;
        
        // Initialize Firebase when it's loaded
        this.waitForFirebase();
    }

    // Wait for Firebase to be loaded
    async waitForFirebase() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        const checkFirebase = () => {
            attempts++;
            if (typeof firebase !== 'undefined') {
                this.initializeFirebase();
                return;
            }
            
            if (attempts < maxAttempts) {
                setTimeout(checkFirebase, 100);
            } else {
                console.error('Firebase failed to load after 5 seconds');
                // Handle Firebase initialization failure
                this.handleFirebaseFailure();
            }
        };
        
        checkFirebase();
    }

    // Initialize Firebase services
    initializeFirebase() {
        try {
            // Use the already initialized Firebase instance from firebase-config.js
            this.auth = window.firebaseAuth || firebase.auth();
            this.db = window.firebaseDb || firebase.firestore();
            
            // Enable offline persistence for better offline experience
            this.enableOfflineSupport();
            
            this.isFirebaseReady = true;
            
            console.log('✅ Firebase services connected successfully');
            
            // Set up authentication state listener
            this.auth.onAuthStateChanged((user) => {
                this.handleAuthStateChange(user);
            });
            
            // Set up network state monitoring
            this.setupNetworkMonitoring();
            
        } catch (error) {
            console.error('Firebase services connection failed:', error);
            this.handleFirebaseFailure();
        }
    }

    // Enable offline support
    enableOfflineSupport() {
        try {
            // Enable offline persistence
            this.db.enablePersistence({ synchronizeTabs: true })
                .then(() => {
                    console.log('✅ Offline persistence enabled');
                })
                .catch((error) => {
                    if (error.code === 'failed-precondition') {
                        console.warn('⚠️ Offline persistence failed: Multiple tabs open');
                    } else if (error.code === 'unimplemented') {
                        console.warn('⚠️ Offline persistence not supported in this browser');
                    } else {
                        console.warn('⚠️ Offline persistence failed:', error);
                    }
                });
        } catch (error) {
            console.warn('⚠️ Could not enable offline persistence:', error);
        }
    }

    // Monitor network connectivity
    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            console.log('✅ Network connection restored');
            if (!this.isFirebaseReady) {
                location.reload(); // Reload to retry Firebase connection
            }
        });

        window.addEventListener('offline', () => {
            console.warn('⚠️ Network connection lost');
        });
    }

    // Handle authentication state changes
    async handleAuthStateChange(firebaseUser) {
        if (firebaseUser) {
            // User is signed in
            try {
                await this.loadUserProfile(firebaseUser);
                this.showMainApp();
            } catch (error) {
                console.error('Error loading user profile:', error);
                this.showLoginScreen();
            }
        } else {
            // User is signed out
            this.currentUser = null;
            this.showLoginScreen();
        }
    }

    // Load user profile from Firestore
    async loadUserProfile(firebaseUser) {
        try {
            const userDoc = await this.db.collection('users').doc(firebaseUser.uid).get();
            
            if (userDoc.exists) {
                // Existing user
                this.currentUser = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email,
                    ...userDoc.data()
                };
            } else {
                // New user - create profile
                const userData = {
                    email: firebaseUser.email,
                    fullName: firebaseUser.displayName || 'User',
                    businessName: 'My Business',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    profile: {
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
                        sessionTimeout: 30
                    }
                };
                
                await this.db.collection('users').doc(firebaseUser.uid).set(userData);
                
                this.currentUser = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email,
                    ...userData
                };
            }
            
            console.log('✅ User profile loaded:', this.currentUser.fullName);
            
        } catch (error) {
            console.error('Error loading user profile:', error);
            throw error;
        }
    }

    // User Registration
    async register(userData) {
        if (!this.isFirebaseReady) {
            return { success: false, message: 'Database connection not ready' };
        }

        const { email, password, fullName, businessName } = userData;

        try {
            // Create Firebase Auth user
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const firebaseUser = userCredential.user;

            // Update display name
            await firebaseUser.updateProfile({
                displayName: fullName
            });

            // Create user profile in Firestore
            const userProfile = {
                email: email,
                fullName: fullName,
                businessName: businessName || fullName + "'s Business",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                profile: {
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
                    sessionTimeout: 30
                }
            };

            await this.db.collection('users').doc(firebaseUser.uid).set(userProfile);

            return { 
                success: true, 
                message: `Welcome ${fullName}! Your account has been created.`,
                user: { id: firebaseUser.uid, email, fullName, businessName }
            };

        } catch (error) {
            console.error('Registration error:', error);
            return { 
                success: false, 
                message: this.getErrorMessage(error.code)
            };
        }
    }

    // User Login
    async login(credentials) {
        if (!this.isFirebaseReady) {
            return { success: false, message: 'Database connection not ready' };
        }

        const { username, password } = credentials;

        try {
            // Firebase uses email for login
            const userCredential = await this.auth.signInWithEmailAndPassword(username, password);
            
            return { 
                success: true, 
                message: `Welcome back!`,
                user: {
                    id: userCredential.user.uid,
                    email: userCredential.user.email
                }
            };

        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                message: this.getErrorMessage(error.code)
            };
        }
    }

    // User Logout
    async logout() {
        try {
            await this.auth.signOut();
            this.currentUser = null;
            console.log('✅ User logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Update user profile
    async updateProfile(profileData) {
        if (!this.currentUser) {
            return { success: false, message: 'Not authenticated' };
        }

        try {
            const userRef = this.db.collection('users').doc(this.currentUser.id);
            const updateData = {};

            // Handle top-level fields
            if (profileData.fullName) updateData.fullName = profileData.fullName;
            if (profileData.businessName) updateData.businessName = profileData.businessName;

            // Handle profile fields
            const profileFields = ['phone', 'address', 'taxId', 'currency', 'dateFormat', 'theme'];
            profileFields.forEach(field => {
                if (profileData[field] !== undefined) {
                    updateData[`profile.${field}`] = profileData[field];
                }
            });

            await userRef.update(updateData);

            // Update local user object
            Object.keys(profileData).forEach(key => {
                if (key === 'fullName' || key === 'businessName') {
                    this.currentUser[key] = profileData[key];
                } else if (profileFields.includes(key)) {
                    this.currentUser.profile[key] = profileData[key];
                }
            });

            this.updateUserInfoInUI();

            return { success: true, message: 'Profile updated successfully' };

        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, message: 'Failed to update profile' };
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        if (!this.currentUser) {
            return { success: false, message: 'Not authenticated' };
        }

        try {
            // Re-authenticate user before changing password
            const credential = firebase.auth.EmailAuthProvider.credential(
                this.currentUser.email,
                currentPassword
            );
            await this.auth.currentUser.reauthenticateWithCredential(credential);

            // Update password
            await this.auth.currentUser.updatePassword(newPassword);

            return { success: true, message: 'Password changed successfully' };

        } catch (error) {
            console.error('Password change error:', error);
            return { 
                success: false, 
                message: this.getErrorMessage(error.code)
            };
        }
    }

    // Subscribe to user data changes for real-time sync
    subscribeToUserData(collection, callback) {
        if (!this.isFirebaseReady || !this.currentUser) {
            console.warn('Firebase not ready or user not authenticated');
            return null;
        }

        try {
            // Listen for real-time updates to user data
            const unsubscribe = this.db.collection('users')
                .doc(this.currentUser.id)
                .collection(collection)
                .onSnapshot((snapshot) => {
                    const data = [];
                    snapshot.forEach((doc) => {
                        data.push({ id: doc.id, ...doc.data() });
                    });
                    callback(data);
                }, (error) => {
                    console.error('Error listening to data changes:', error);
                });

            return unsubscribe;
        } catch (error) {
            console.error('Error setting up data subscription:', error);
            return null;
        }
    }

    // Enhanced data storage with real-time sync and offline support
    async setUserData(collection, data) {
        if (!this.isFirebaseReady || !this.currentUser) {
            console.warn('Firebase not ready or user not authenticated');
            return false;
        }

        try {
            // Prepare document data with metadata
            const documentData = {
                data: data,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                userId: this.currentUser.id,
                version: Date.now(), // Version for conflict resolution
                dataSize: JSON.stringify(data).length // Track data size
            };

            // Store data in Firestore with user-specific collection
            await this.db.collection('users')
                .doc(this.currentUser.id)
                .collection(collection)
                .doc('data')
                .set(documentData);

            console.log(`✅ Data saved to Firebase: ${collection} (${documentData.dataSize} bytes)`);
            return true;
        } catch (error) {
            console.error(`❌ Error saving data to Firebase (${collection}):`, error);
            
            // Show user-friendly error message
            if (typeof showAuthMessage === 'function') {
                if (error.code === 'permission-denied') {
                    showAuthMessage('Permission denied. Please log in again.', 'danger');
                } else if (error.code === 'unavailable') {
                    showAuthMessage('Service temporarily unavailable. Your data will be saved when connection is restored.', 'warning');
                } else {
                    showAuthMessage('Failed to save data. Please try again.', 'danger');
                }
            }
            
            return false;
        }
    }

    // Enhanced data retrieval with caching and offline support
    async getUserData(collection, defaultValue = null) {
        if (!this.isFirebaseReady || !this.currentUser) {
            console.warn('Firebase not ready or user not authenticated');
            return defaultValue;
        }

        try {
            // Use offline cache first, then sync with server
            const doc = await this.db.collection('users')
                .doc(this.currentUser.id)
                .collection(collection)
                .doc('data')
                .get({ source: 'cache' })
                .catch(() => {
                    // If cache fails, try server
                    return this.db.collection('users')
                        .doc(this.currentUser.id)
                        .collection(collection)
                        .doc('data')
                        .get();
                });

            if (doc.exists) {
                const docData = doc.data();
                const dataSize = docData.dataSize || 0;
                const lastUpdated = docData.lastUpdated?.toDate?.() || new Date();
                
                console.log(`✅ Data loaded from Firebase: ${collection} (${dataSize} bytes, last updated: ${lastUpdated.toLocaleString()})`);
                
                // Return the actual data
                return docData.data || defaultValue;
            } else {
                console.log(`📭 No data found in Firebase for: ${collection}`);
                return defaultValue;
            }
        } catch (error) {
            console.error(`❌ Error loading data from Firebase (${collection}):`, error);
            
            // Show user-friendly error message
            if (typeof showAuthMessage === 'function') {
                if (error.code === 'permission-denied') {
                    showAuthMessage('Permission denied. Please log in again.', 'danger');
                } else if (error.code === 'unavailable') {
                    showAuthMessage('Data service temporarily unavailable. Using cached data if available.', 'warning');
                } else {
                    showAuthMessage('Failed to load data from cloud. Please check your connection.', 'warning');
                }
            }
            
            return defaultValue;
        }
    }

    async clearUserData(collection) {
        if (!this.currentUser) return false;

        try {
            const userCollection = this.db.collection('users').doc(this.currentUser.id).collection(collection);
            const snapshot = await userCollection.get();
            
            const batch = this.db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            console.log(`✅ Cleared all data from Firebase collection: ${collection}`);
            return true;

        } catch (error) {
            console.error(`❌ Error clearing user data (${collection}):`, error);
            return false;
        }
    }

    // Get data storage statistics
    async getDataStatistics() {
        if (!this.isFirebaseReady || !this.currentUser) {
            return null;
        }

        try {
            const collections = ['gl_accounts', 'gl_journal_entries', 'gl_next_entry_id', 'gl_next_account_id'];
            const stats = {
                totalSize: 0,
                collections: {},
                lastUpdated: null
            };

            for (const collection of collections) {
                try {
                    const doc = await this.db.collection('users')
                        .doc(this.currentUser.id)
                        .collection(collection)
                        .doc('data')
                        .get();

                    if (doc.exists) {
                        const docData = doc.data();
                        const size = docData.dataSize || 0;
                        const lastUpdated = docData.lastUpdated?.toDate?.() || null;
                        
                        stats.collections[collection] = {
                            size: size,
                            lastUpdated: lastUpdated
                        };
                        stats.totalSize += size;
                        
                        if (!stats.lastUpdated || (lastUpdated && lastUpdated > stats.lastUpdated)) {
                            stats.lastUpdated = lastUpdated;
                        }
                    }
                } catch (error) {
                    console.warn(`Could not get stats for ${collection}:`, error);
                }
            }

            return stats;
        } catch (error) {
            console.error('Error getting data statistics:', error);
            return null;
        }
    }

    // Create data backup
    async createDataBackup() {
        if (!this.isFirebaseReady || !this.currentUser) {
            return null;
        }

        try {
            const backup = {
                createdAt: new Date().toISOString(),
                userId: this.currentUser.id,
                userEmail: this.currentUser.email,
                businessName: this.currentUser.businessName,
                data: {}
            };

            // Backup all collections
            const collections = ['gl_accounts', 'gl_journal_entries', 'gl_next_entry_id', 'gl_next_account_id'];
            
            for (const collection of collections) {
                try {
                    const data = await this.getUserData(collection);
                    if (data !== null) {
                        backup.data[collection] = data;
                    }
                } catch (error) {
                    console.warn(`Could not backup ${collection}:`, error);
                }
            }

            console.log('✅ Data backup created successfully');
            return backup;
        } catch (error) {
            console.error('❌ Error creating data backup:', error);
            return null;
        }
    }

    // Get current user (safe)
    getCurrentUser() {
        return this.currentUser;
    }

    getCurrentUserSafe() {
        if (!this.currentUser) return null;
        
        const { ...safeUser } = this.currentUser;
        return safeUser;
    }

    // Validate data integrity
    async validateDataIntegrity() {
        if (!this.isFirebaseReady || !this.currentUser) {
            return { valid: false, message: 'Not authenticated' };
        }

        try {
            const validation = {
                valid: true,
                errors: [],
                warnings: [],
                statistics: await this.getDataStatistics()
            };

            // Check if user has any data
            const accounts = await this.getUserData('gl_accounts', []);
            const journalEntries = await this.getUserData('gl_journal_entries', []);

            if (accounts.length === 0 && journalEntries.length === 0) {
                validation.warnings.push('No accounting data found');
            }

            // Validate account structure
            if (accounts.length > 0) {
                accounts.forEach((account, index) => {
                    if (!account.id || !account.name || !account.type) {
                        validation.errors.push(`Account ${index + 1} missing required fields`);
                        validation.valid = false;
                    }
                });
            }

            // Validate journal entries
            if (journalEntries.length > 0) {
                journalEntries.forEach((entry, index) => {
                    if (!entry.id || !entry.date || !entry.transactions) {
                        validation.errors.push(`Journal entry ${index + 1} missing required fields`);
                        validation.valid = false;
                    }
                });
            }

            console.log(`✅ Data integrity validation completed: ${validation.valid ? 'PASSED' : 'FAILED'}`);
            return validation;

        } catch (error) {
            console.error('❌ Error validating data integrity:', error);
            return { valid: false, message: 'Validation failed', error: error.message };
        }
    }

    // Error message handling
    getErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/email-already-in-use':
                return 'This email is already registered. Please use a different email or try signing in.';
            case 'auth/weak-password':
                return 'Password is too weak. Please use at least 6 characters.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/user-not-found':
                return 'No account found with this email address. Please check your email or create a new account.';
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again or reset your password.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later or reset your password.';
            case 'auth/requires-recent-login':
                return 'Please log out and log in again to change your password.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your internet connection and try again.';
            case 'auth/internal-error':
                return 'Internal error occurred. Please try again later.';
            case 'auth/missing-email':
                return 'Please enter an email address.';
            case 'auth/invalid-credential':
                return 'Invalid login credentials. Please check your email and password.';
            default:
                console.error('Unhandled auth error:', errorCode);
                return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
        }
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
        
        this.updateUserInfoInUI();
        
        // Initialize the accounting app with user data
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

    // Handle Firebase initialization failure
    handleFirebaseFailure() {
        console.error('❌ Firebase authentication failed to initialize');
        
        // Show error message to user
        const loginContainer = document.getElementById('loginContainer');
        if (loginContainer) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger';
            errorDiv.innerHTML = `
                <h5><i class="fas fa-exclamation-triangle"></i> Connection Error</h5>
                <p>Unable to connect to authentication service. Please check your internet connection and try again.</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            `;
            
            const authMessages = document.querySelector('.auth-messages');
            if (authMessages) {
                authMessages.appendChild(errorDiv);
            }
        }
    }

    // Password Reset
    async resetPassword(email) {
        if (!this.isFirebaseReady) {
            return { success: false, message: 'Database connection not ready' };
        }

        try {
            await this.auth.sendPasswordResetEmail(email);
            return { 
                success: true, 
                message: 'Password reset email sent! Please check your inbox.' 
            };
        } catch (error) {
            console.error('Password reset error:', error);
            return { 
                success: false, 
                message: this.getErrorMessage(error.code) 
            };
        }
    }

    // Demo user creation
    async createDemoUser() {
        const demoData = {
            email: 'demo@fungacct.com',
            password: 'Demo123!',
            fullName: 'Demo User',
            businessName: 'Demo Restaurant Business'
        };

        return this.register(demoData);
    }



    // Check if Firebase is ready
    isReady() {
        return this.isFirebaseReady;
    }

    // Get database reference for advanced queries
    getDatabase() {
        return this.db;
    }

    // Get auth reference for advanced auth operations
    getAuth() {
        return this.auth;
    }
}

// Global Firebase auth instance
let firebaseAuthSystem;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing Firebase auth system...');
    
    // Check if Firebase SDK is loaded
    if (typeof firebase !== 'undefined') {
        console.log('✅ Firebase SDK detected, creating Firebase auth system...');
        firebaseAuthSystem = new FirebaseAuthSystem();
        window.authSystem = firebaseAuthSystem;
        console.log('✅ Firebase auth system created and assigned to window.authSystem');
    } else {
        console.error('❌ Firebase SDK not loaded. Please check your internet connection.');
        
        // Show error message to user
        const loginContainer = document.getElementById('loginContainer');
        if (loginContainer) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger';
            errorDiv.innerHTML = `
                <h5><i class="fas fa-exclamation-triangle"></i> Setup Error</h5>
                <p>Authentication system could not be loaded. Please refresh the page or check your internet connection.</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-refresh"></i> Refresh Page
                </button>
            `;
            
            const authMessages = document.querySelector('.auth-messages');
            if (authMessages) {
                authMessages.appendChild(errorDiv);
            }
        }
    }
});

// Global functions updated for Firebase
function performFirebaseLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showAuthMessage('Please enter both email and password', 'danger');
        return;
    }

    if (window.authSystem && window.authSystem.login) {
        window.authSystem.login({ username, password }).then(result => {
            if (result.success) {
                showAuthMessage(result.message, 'success');
            } else {
                showAuthMessage(result.message, 'danger');
            }
        });
    }
}

function performFirebaseRegister() {
    const userData = {
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        confirmPassword: document.getElementById('registerConfirmPassword').value,
        fullName: document.getElementById('registerFullName').value,
        businessName: document.getElementById('registerBusinessName').value
    };

    // Basic validation
    if (userData.password !== userData.confirmPassword) {
        showAuthMessage('Passwords do not match', 'danger');
        return;
    }

    if (window.authSystem && window.authSystem.register) {
        window.authSystem.register(userData).then(result => {
            if (result.success) {
                showAuthMessage(result.message, 'success');
            } else {
                showAuthMessage(result.message, 'danger');
            }
        });
    }
}

function createFirebaseDemoUser() {
    if (window.authSystem && window.authSystem.createDemoUser) {
        window.authSystem.createDemoUser().then(result => {
            if (result.success) {
                showAuthMessage('Demo user created and logged in successfully!', 'success');
            } else {
                showAuthMessage(result.message, 'danger');
            }
        });
    }
}

// Global logout function
function performLogout() {
    if (window.authSystem && window.authSystem.logout) {
        window.authSystem.logout().then(() => {
            console.log('User logged out successfully');
        }).catch(error => {
            console.error('Logout error:', error);
        });
    }
}

// Password reset function
function performPasswordReset() {
    const email = document.getElementById('forgotEmail').value;

    if (!email) {
        showAuthMessage('Please enter your email address', 'danger');
        return;
    }

    if (window.authSystem && window.authSystem.resetPassword) {
        window.authSystem.resetPassword(email).then(result => {
            if (result.success) {
                showAuthMessage(result.message, 'success');
                // Switch back to login form after successful reset
                setTimeout(() => {
                    showLoginForm();
                }, 3000);
            } else {
                showAuthMessage(result.message, 'danger');
            }
        });
    }
}

