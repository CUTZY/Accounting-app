// Firebase Authentication and Database System for Fung's Accounting App
// Replaces localStorage with cloud-based Firebase Firestore

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
                // Fallback to localStorage auth system
                this.fallbackToLocalStorage();
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
            this.isFirebaseReady = true;
            
            console.log('✅ Firebase services connected successfully');
            
            // Set up authentication state listener
            this.auth.onAuthStateChanged((user) => {
                this.handleAuthStateChange(user);
            });
            
        } catch (error) {
            console.error('Firebase services connection failed:', error);
            this.fallbackToLocalStorage();
        }
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

    // Data Storage - User-specific collections
    async setUserData(collection, data) {
        if (!this.currentUser) {
            console.warn('No authenticated user - cannot save data');
            return false;
        }

        try {
            const userCollection = this.db.collection('users').doc(this.currentUser.id).collection(collection);
            
            if (Array.isArray(data)) {
                // Save array data - use batch write for better performance
                const batch = this.db.batch();
                
                // Clear existing data
                const existingDocs = await userCollection.get();
                existingDocs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                // Add new data
                data.forEach(item => {
                    const docRef = userCollection.doc(item.id?.toString() || userCollection.doc().id);
                    batch.set(docRef, item);
                });
                
                await batch.commit();
            } else {
                // Save single document
                await userCollection.doc('data').set(data);
            }

            return true;

        } catch (error) {
            console.error('Error saving user data:', error);
            return false;
        }
    }

    async getUserData(collection, defaultValue = null) {
        if (!this.currentUser) {
            return defaultValue;
        }

        try {
            const userCollection = this.db.collection('users').doc(this.currentUser.id).collection(collection);
            
            if (collection === 'gl_accounts' || collection === 'gl_journal_entries') {
                // Array data
                const snapshot = await userCollection.get();
                const data = [];
                snapshot.forEach(doc => {
                    data.push({ id: doc.id, ...doc.data() });
                });
                return data.length > 0 ? data : defaultValue;
            } else {
                // Single document data
                const doc = await userCollection.doc('data').get();
                return doc.exists ? doc.data() : defaultValue;
            }

        } catch (error) {
            console.error('Error loading user data:', error);
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
            return true;

        } catch (error) {
            console.error('Error clearing user data:', error);
            return false;
        }
    }

    // Real-time data sync
    subscribeToUserData(collection, callback) {
        if (!this.currentUser) return null;

        const userCollection = this.db.collection('users').doc(this.currentUser.id).collection(collection);
        
        return userCollection.onSnapshot((snapshot) => {
            const data = [];
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });
            callback(data);
        }, (error) => {
            console.error('Real-time sync error:', error);
        });
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
            case 'auth/wrong-password':
                return 'Invalid email or password. Please check your credentials.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later.';
            case 'auth/requires-recent-login':
                return 'Please log out and log in again to change your password.';
            default:
                return 'An error occurred. Please try again.';
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

    // Fallback to localStorage if Firebase fails
    fallbackToLocalStorage() {
        console.warn('⚠️ Firebase unavailable - falling back to localStorage');
        
        // Load the original localStorage auth system
        if (typeof AuthSystem !== 'undefined') {
            window.authSystem = new AuthSystem();
        } else {
            console.error('No fallback authentication system available');
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

    // Migration utility from localStorage to Firebase
    async migrateFromLocalStorage() {
        if (!this.currentUser) {
            console.warn('No user logged in for migration');
            return false;
        }

        try {
            // Get data from localStorage
            const accounts = JSON.parse(localStorage.getItem('gl_accounts') || '[]');
            const journalEntries = JSON.parse(localStorage.getItem('gl_journal_entries') || '[]');
            const nextEntryId = parseInt(localStorage.getItem('gl_next_entry_id') || '1');
            const nextAccountId = parseInt(localStorage.getItem('gl_next_account_id') || '1');

            if (accounts.length > 0 || journalEntries.length > 0) {
                // Migrate to Firebase
                await this.setUserData('gl_accounts', accounts);
                await this.setUserData('gl_journal_entries', journalEntries);
                await this.setUserData('gl_next_entry_id', nextEntryId);
                await this.setUserData('gl_next_account_id', nextAccountId);

                console.log('✅ Data migrated from localStorage to Firebase');
                
                // Optionally clear localStorage after successful migration
                if (confirm('Data migrated successfully! Clear local storage?')) {
                    localStorage.removeItem('gl_accounts');
                    localStorage.removeItem('gl_journal_entries');
                    localStorage.removeItem('gl_next_entry_id');
                    localStorage.removeItem('gl_next_account_id');
                }

                return true;
            }

            return false;

        } catch (error) {
            console.error('Migration error:', error);
            return false;
        }
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
    // Use Firebase auth if available, otherwise fallback to localStorage
    if (typeof firebase !== 'undefined') {
        firebaseAuthSystem = new FirebaseAuthSystem();
        window.authSystem = firebaseAuthSystem;
    } else {
        console.warn('Firebase not loaded - using localStorage auth system');
        // The original AuthSystem will be used
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

// Migration function
function migrateToFirebase() {
    if (window.authSystem && window.authSystem.migrateFromLocalStorage) {
        window.authSystem.migrateFromLocalStorage().then(success => {
            if (success) {
                showAuthMessage('Data successfully migrated to cloud database!', 'success');
                // Reload the app to show migrated data
                if (typeof app !== 'undefined') {
                    app.loadUserData();
                }
            } else {
                showAuthMessage('No local data found to migrate', 'info');
            }
        });
    }
}