// General Ledger Accounting App - JavaScript
// Data storage and management

class AccountingApp {
    constructor() {
        // Initialize empty state - data will be loaded after authentication
        this.accounts = [];
        this.journalEntries = [];
        this.nextEntryId = 1;
        this.nextAccountId = 1;
        
        // Initialize edit mode variables
        this.accountEditMode = false;
        this.editingAccountId = null;
        this.entryEditMode = false;
        this.editingEntryId = null;
        
        // Only initialize basic UI elements, not data-dependent ones
        this.initializeAppBasics();
    }

    // Basic initialization that doesn't depend on user data
    initializeAppBasics() {
        // Set up modal event listeners
        this.setupModalEventListeners();
    }

    // Load user-specific data after authentication
    async loadUserData() {
        console.log('🔄 Loading user data...');
        console.log('Auth system:', window.authSystem);
        console.log('Current user:', window.authSystem?.currentUser);
        
        if (!authSystem || !authSystem.currentUser) {
            console.warn('No authenticated user found');
            return;
        }

        try {
            console.log('📥 Loading accounts from Firebase...');
            this.accounts = await authSystem.getUserData('gl_accounts', []);
            console.log('📥 Loading journal entries from Firebase...');
            this.journalEntries = await authSystem.getUserData('gl_journal_entries', []);
            console.log('📥 Loading next IDs from Firebase...');
            this.nextEntryId = await authSystem.getUserData('gl_next_entry_id', 1);
            this.nextAccountId = await authSystem.getUserData('gl_next_account_id', 1);
            
            console.log('✅ User data loaded from Firebase:', {
                accounts: this.accounts.length,
                entries: this.journalEntries.length,
                nextEntryId: this.nextEntryId,
                nextAccountId: this.nextAccountId
            });
            
            // Set up real-time data synchronization
            this.setupRealTimeSync();
            
            // Now that data is loaded, initialize the full app
            this.initializeApp();
        } catch (error) {
            console.error('❌ Error loading user data:', error);
            // Fallback to empty data
            this.accounts = [];
            this.journalEntries = [];
            this.nextEntryId = 1;
            this.nextAccountId = 1;
            this.initializeApp();
        }
    }

    // Set up real-time data synchronization
    setupRealTimeSync() {
        if (!authSystem || !authSystem.currentUser) return;

        // Listen for real-time updates to accounts
        this.accountsUnsubscribe = authSystem.subscribeToUserData('gl_accounts', (accounts) => {
            if (accounts && accounts.length > 0) {
                this.accounts = accounts[0].data || [];
                this.loadAccountsList();
                this.updateDashboardSummary();
            }
        });

        // Listen for real-time updates to journal entries
        this.entriesUnsubscribe = authSystem.subscribeToUserData('gl_journal_entries', (entries) => {
            if (entries && entries.length > 0) {
                this.journalEntries = entries[0].data || [];
                this.loadJournalEntries();
                this.updateDashboardSummary();
            }
        });

        console.log('✅ Real-time data synchronization enabled');
    }

    // Clear user data from memory (called during logout)
    clearUserData() {
        // Clean up real-time listeners
        this.cleanupRealTimeSync();
        
        // Clear data from memory
        this.accounts = [];
        this.journalEntries = [];
        this.nextEntryId = 1;
        this.nextAccountId = 1;
    }

    // Initialize the application
    initializeApp() {
        // Set today's date as default (only if element exists)
        const entryDateElement = document.getElementById('entryDate');
        if (entryDateElement) {
            const today = new Date().toISOString().split('T')[0];
            entryDateElement.value = today;
        }
        
        // Set up modal event listeners
        this.setupModalEventListeners();
        
        // Load the dashboard
        this.loadDashboard();
        this.loadAccountsList();
        this.loadJournalEntries();
    }

    // Setup event listeners for modals
    setupModalEventListeners() {
        // Reset account modal when closed
        $('#addAccountModal').on('hidden.bs.modal', () => {
            this.resetAccountModal();
        });
        
        // Reset journal entry modal when closed
        $('#addEntryModal').on('hidden.bs.modal', () => {
            this.resetEntryModal();
        });
    }

    // Reset app with fresh demo data
    loadDemoData() {
        // Clear existing data
        this.accounts = [];
        this.journalEntries = [];
        this.nextEntryId = 1;
        this.nextAccountId = 1;
        
        // Load fresh demo data
        this.loadDefaultAccounts();
        
        // Refresh all displays
        this.loadDashboard();
        this.loadAccountsList();
        this.loadJournalEntries();
        
        this.showNotification('Demo restaurant data loaded successfully!', 'success');
    }

    // Clear all data and start fresh
    clearAllData() {
        // Check authentication
        if (!authSystem || !authSystem.currentUser) {
            this.showNotification('Please log in to manage your data.', 'warning');
            return;
        }

        // Check if there's any data to clear
        if (this.accounts.length === 0 && this.journalEntries.length === 0) {
            this.showNotification('No data to clear. The application is already empty.', 'info');
            return;
        }

        // Show confirmation dialog with data summary
        const accountCount = this.accounts.length;
        const entryCount = this.journalEntries.length;
        
        const confirmMessage = `⚠️ Are you sure you want to clear ALL data?\n\nThis will permanently delete:\n• ${accountCount} accounts\n• ${entryCount} journal entries\n• All financial data\n\nThis action cannot be undone!\n\nClick OK to clear everything and start fresh.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }

        // Clear all data
        this.accounts = [];
        this.journalEntries = [];
        this.nextEntryId = 1;
        this.nextAccountId = 1;
        
        // Clear user-specific data storage
        authSystem.clearUserData('gl_accounts');
        authSystem.clearUserData('gl_journal_entries');
        authSystem.clearUserData('gl_next_entry_id');
        authSystem.clearUserData('gl_next_account_id');
        
        // Refresh all displays
        this.loadDashboard();
        this.loadAccountsList();
        this.loadJournalEntries();
        
        this.showNotification(`All data cleared successfully! Removed ${accountCount} accounts and ${entryCount} journal entries. You can now start fresh or load demo data.`, 'success');
    }

    // Load default chart of accounts for restaurant business
    loadDefaultAccounts() {
        const defaultAccounts = [
            // Assets
            { id: 1, number: '1000', name: 'Cash', type: 'Asset', description: 'Cash register and petty cash' },
            { id: 2, number: '1050', name: 'Bank Account', type: 'Asset', description: 'Business checking account' },
            { id: 3, number: '1200', name: 'Accounts Receivable', type: 'Asset', description: 'Catering and corporate orders' },
            { id: 4, number: '1300', name: 'Food Inventory', type: 'Asset', description: 'Food ingredients and supplies' },
            { id: 5, number: '1350', name: 'Beverage Inventory', type: 'Asset', description: 'Drinks and beverage supplies' },
            { id: 6, number: '1400', name: 'Prepaid Rent', type: 'Asset', description: 'Prepaid restaurant rent' },
            { id: 7, number: '1700', name: 'Kitchen Equipment', type: 'Asset', description: 'Stoves, ovens, refrigerators' },
            { id: 8, number: '1750', name: 'Furniture & Fixtures', type: 'Asset', description: 'Tables, chairs, decor' },
            
            // Liabilities  
            { id: 9, number: '2000', name: 'Accounts Payable', type: 'Liability', description: 'Money owed to food suppliers' },
            { id: 10, number: '2100', name: 'Accrued Wages', type: 'Liability', description: 'Unpaid wages to staff' },
            { id: 11, number: '2200', name: 'Sales Tax Payable', type: 'Liability', description: 'Sales tax collected' },
            { id: 12, number: '2500', name: 'Equipment Loan', type: 'Liability', description: 'Loan for kitchen equipment' },
            
            // Equity
            { id: 13, number: '3000', name: 'Owner\'s Equity', type: 'Equity', description: 'Owner\'s investment in restaurant' },
            { id: 14, number: '3500', name: 'Retained Earnings', type: 'Equity', description: 'Accumulated restaurant profits' },
            
            // Revenue
            { id: 15, number: '4000', name: 'Food Sales', type: 'Revenue', description: 'Revenue from food sales' },
            { id: 16, number: '4100', name: 'Beverage Sales', type: 'Revenue', description: 'Revenue from drink sales' },
            { id: 17, number: '4200', name: 'Catering Revenue', type: 'Revenue', description: 'Income from catering services' },
            
            // Expenses
            { id: 18, number: '5000', name: 'Food Costs', type: 'Expense', description: 'Cost of food ingredients' },
            { id: 19, number: '5100', name: 'Beverage Costs', type: 'Expense', description: 'Cost of beverages' },
            { id: 20, number: '6000', name: 'Wages & Salaries', type: 'Expense', description: 'Staff wages and salaries' },
            { id: 21, number: '6100', name: 'Rent Expense', type: 'Expense', description: 'Monthly restaurant rent' },
            { id: 22, number: '6200', name: 'Utilities Expense', type: 'Expense', description: 'Electricity, gas, water' },
            { id: 23, number: '6300', name: 'Marketing & Advertising', type: 'Expense', description: 'Promotional expenses' },
            { id: 24, number: '6400', name: 'Equipment Maintenance', type: 'Expense', description: 'Kitchen equipment repairs' },
            { id: 25, number: '6500', name: 'Insurance Expense', type: 'Expense', description: 'Business insurance premiums' },
            { id: 26, number: '6600', name: 'Supplies Expense', type: 'Expense', description: 'Paper goods, cleaning supplies' },
            { id: 27, number: '6700', name: 'Delivery Fees', type: 'Expense', description: 'Food delivery service fees' }
        ];

        this.accounts = defaultAccounts;
        this.nextAccountId = 28;
        
        // Load demo journal entries for restaurant
        this.loadDemoJournalEntries();
        
        this.saveData();
    }

    // Load demo journal entries for restaurant business
    loadDemoJournalEntries() {
        const demoEntries = [
            // Owner's initial investment
            {
                id: 1,
                date: '2024-01-01',
                reference: 'INV001',
                description: 'Owner initial investment to start restaurant',
                transactions: [
                    { accountId: 2, debit: 50000, credit: 0 }, // Bank Account
                    { accountId: 13, debit: 0, credit: 50000 } // Owner's Equity
                ],
                createdAt: '2024-01-01T09:00:00.000Z'
            },

            // Purchase kitchen equipment
            {
                id: 2,
                date: '2024-01-02',
                reference: 'EQ001',
                description: 'Purchase kitchen equipment - stoves, ovens, refrigerator',
                transactions: [
                    { accountId: 7, debit: 25000, credit: 0 }, // Kitchen Equipment
                    { accountId: 2, debit: 0, credit: 15000 }, // Bank Account
                    { accountId: 12, debit: 0, credit: 10000 } // Equipment Loan
                ],
                createdAt: '2024-01-02T10:30:00.000Z'
            },

            // Purchase furniture and fixtures
            {
                id: 3,
                date: '2024-01-03',
                reference: 'FUR001',
                description: 'Purchase dining tables, chairs, and restaurant decor',
                transactions: [
                    { accountId: 8, debit: 8000, credit: 0 }, // Furniture & Fixtures
                    { accountId: 2, debit: 0, credit: 8000 } // Bank Account
                ],
                createdAt: '2024-01-03T14:15:00.000Z'
            },

            // Prepay rent for 3 months
            {
                id: 4,
                date: '2024-01-05',
                reference: 'RENT001',
                description: 'Prepaid rent for restaurant space - 3 months',
                transactions: [
                    { accountId: 6, debit: 9000, credit: 0 }, // Prepaid Rent
                    { accountId: 2, debit: 0, credit: 9000 } // Bank Account
                ],
                createdAt: '2024-01-05T11:00:00.000Z'
            },

            // Initial food inventory purchase
            {
                id: 5,
                date: '2024-01-10',
                reference: 'FOOD001',
                description: 'Initial food inventory purchase from Fresh Foods Supplier',
                transactions: [
                    { accountId: 4, debit: 3500, credit: 0 }, // Food Inventory
                    { accountId: 9, debit: 0, credit: 3500 } // Accounts Payable
                ],
                createdAt: '2024-01-10T08:30:00.000Z'
            },

            // Initial beverage inventory purchase
            {
                id: 6,
                date: '2024-01-10',
                reference: 'BEV001',
                description: 'Initial beverage inventory - sodas, juices, coffee',
                transactions: [
                    { accountId: 5, debit: 1200, credit: 0 }, // Beverage Inventory
                    { accountId: 9, debit: 0, credit: 1200 } // Accounts Payable
                ],
                createdAt: '2024-01-10T09:15:00.000Z'
            },

            // Daily sales - Day 1
            {
                id: 7,
                date: '2024-01-15',
                reference: 'SALES001',
                description: 'Daily sales - opening day',
                transactions: [
                    { accountId: 1, debit: 850, credit: 0 }, // Cash
                    { accountId: 2, debit: 1200, credit: 0 }, // Bank Account (card payments)
                    { accountId: 15, debit: 0, credit: 1640 }, // Food Sales
                    { accountId: 16, debit: 0, credit: 280 }, // Beverage Sales
                    { accountId: 11, debit: 0, credit: 130 } // Sales Tax Payable
                ],
                createdAt: '2024-01-15T22:00:00.000Z'
            },

            // Record cost of goods sold for Day 1
            {
                id: 8,
                date: '2024-01-15',
                reference: 'COGS001',
                description: 'Cost of goods sold - opening day',
                transactions: [
                    { accountId: 18, debit: 520, credit: 0 }, // Food Costs
                    { accountId: 19, debit: 85, credit: 0 }, // Beverage Costs
                    { accountId: 4, debit: 0, credit: 520 }, // Food Inventory
                    { accountId: 5, debit: 0, credit: 85 } // Beverage Inventory
                ],
                createdAt: '2024-01-15T23:00:00.000Z'
            },

            // Pay staff wages for first week
            {
                id: 9,
                date: '2024-01-21',
                reference: 'PAY001',
                description: 'Weekly payroll - kitchen and service staff',
                transactions: [
                    { accountId: 20, debit: 2800, credit: 0 }, // Wages & Salaries
                    { accountId: 2, debit: 0, credit: 2800 } // Bank Account
                ],
                createdAt: '2024-01-21T17:00:00.000Z'
            },

            // Daily sales - Weekend rush
            {
                id: 10,
                date: '2024-01-21',
                reference: 'SALES002',
                description: 'Weekend sales - busy Saturday',
                transactions: [
                    { accountId: 1, debit: 1450, credit: 0 }, // Cash
                    { accountId: 2, debit: 2100, credit: 0 }, // Bank Account
                    { accountId: 15, debit: 0, credit: 2840 }, // Food Sales
                    { accountId: 16, debit: 0, credit: 485 }, // Beverage Sales
                    { accountId: 11, debit: 0, credit: 225 } // Sales Tax Payable
                ],
                createdAt: '2024-01-21T23:30:00.000Z'
            },

            // Catering order
            {
                id: 11,
                date: '2024-01-25',
                reference: 'CAT001',
                description: 'Catering order for local business meeting',
                transactions: [
                    { accountId: 3, debit: 950, credit: 0 }, // Accounts Receivable
                    { accountId: 17, debit: 0, credit: 950 } // Catering Revenue
                ],
                createdAt: '2024-01-25T16:00:00.000Z'
            },

            // Food supplier payment
            {
                id: 12,
                date: '2024-01-30',
                reference: 'PAY002',
                description: 'Payment to Fresh Foods Supplier',
                transactions: [
                    { accountId: 9, debit: 3500, credit: 0 }, // Accounts Payable
                    { accountId: 2, debit: 0, credit: 3500 } // Bank Account
                ],
                createdAt: '2024-01-30T14:20:00.000Z'
            },

            // Monthly rent expense
            {
                id: 13,
                date: '2024-01-31',
                reference: 'RENT002',
                description: 'Monthly rent expense - January',
                transactions: [
                    { accountId: 21, debit: 3000, credit: 0 }, // Rent Expense
                    { accountId: 6, debit: 0, credit: 3000 } // Prepaid Rent
                ],
                createdAt: '2024-01-31T12:00:00.000Z'
            },

            // Utilities payment
            {
                id: 14,
                date: '2024-01-31',
                reference: 'UTIL001',
                description: 'Monthly utilities - electricity, gas, water',
                transactions: [
                    { accountId: 22, debit: 450, credit: 0 }, // Utilities Expense
                    { accountId: 2, debit: 0, credit: 450 } // Bank Account
                ],
                createdAt: '2024-01-31T15:45:00.000Z'
            },

            // Marketing expense
            {
                id: 15,
                date: '2024-02-01',
                reference: 'MKT001',
                description: 'Social media advertising campaign',
                transactions: [
                    { accountId: 23, debit: 300, credit: 0 }, // Marketing & Advertising
                    { accountId: 2, debit: 0, credit: 300 } // Bank Account
                ],
                createdAt: '2024-02-01T10:30:00.000Z'
            },

            // Equipment maintenance
            {
                id: 16,
                date: '2024-02-05',
                reference: 'MAINT001',
                description: 'Repair of commercial oven',
                transactions: [
                    { accountId: 24, debit: 275, credit: 0 }, // Equipment Maintenance
                    { accountId: 1, debit: 0, credit: 275 } // Cash
                ],
                createdAt: '2024-02-05T11:15:00.000Z'
            },

            // Insurance payment
            {
                id: 17,
                date: '2024-02-10',
                reference: 'INS001',
                description: 'Monthly business insurance premium',
                transactions: [
                    { accountId: 25, debit: 650, credit: 0 }, // Insurance Expense
                    { accountId: 2, debit: 0, credit: 650 } // Bank Account
                ],
                createdAt: '2024-02-10T09:00:00.000Z'
            },

            // Supplies purchase
            {
                id: 18,
                date: '2024-02-12',
                reference: 'SUP001',
                description: 'Purchase cleaning supplies and paper goods',
                transactions: [
                    { accountId: 26, debit: 180, credit: 0 }, // Supplies Expense
                    { accountId: 1, debit: 0, credit: 180 } // Cash
                ],
                createdAt: '2024-02-12T14:30:00.000Z'
            },

            // Delivery fees
            {
                id: 19,
                date: '2024-02-14',
                reference: 'DEL001',
                description: 'Valentine\'s Day delivery service fees',
                transactions: [
                    { accountId: 27, debit: 95, credit: 0 }, // Delivery Fees
                    { accountId: 1, debit: 0, credit: 95 } // Cash
                ],
                createdAt: '2024-02-14T20:45:00.000Z'
            },

            // Strong daily sales
            {
                id: 20,
                date: '2024-02-14',
                reference: 'SALES003',
                description: 'Valentine\'s Day special menu sales',
                transactions: [
                    { accountId: 1, debit: 1950, credit: 0 }, // Cash
                    { accountId: 2, debit: 2800, credit: 0 }, // Bank Account
                    { accountId: 15, debit: 0, credit: 3800 }, // Food Sales
                    { accountId: 16, debit: 0, credit: 650 }, // Beverage Sales
                    { accountId: 11, debit: 0, credit: 300 } // Sales Tax Payable
                ],
                createdAt: '2024-02-14T23:59:00.000Z'
            }
        ];

        this.journalEntries = demoEntries;
        this.nextEntryId = 21;
    }

    // Save data to user-specific storage
    async saveData() {
        console.log('💾 Saving data to Firebase...');
        console.log('Auth system:', window.authSystem);
        console.log('Current user:', window.authSystem?.currentUser);
        
        if (!authSystem || !authSystem.currentUser) {
            console.warn('No authenticated user - cannot save data');
            return;
        }

        try {
            console.log('💾 Saving accounts to Firebase...');
            await authSystem.setUserData('gl_accounts', this.accounts);
            console.log('💾 Saving journal entries to Firebase...');
            await authSystem.setUserData('gl_journal_entries', this.journalEntries);
            console.log('💾 Saving next IDs to Firebase...');
            await authSystem.setUserData('gl_next_entry_id', this.nextEntryId);
            await authSystem.setUserData('gl_next_account_id', this.nextAccountId);
            
            console.log('✅ Data saved to Firebase successfully');
        } catch (error) {
            console.error('❌ Error saving data to Firebase:', error);
        }
    }

    // Clean up real-time listeners
    cleanupRealTimeSync() {
        if (this.accountsUnsubscribe) {
            this.accountsUnsubscribe();
            this.accountsUnsubscribe = null;
        }
        if (this.entriesUnsubscribe) {
            this.entriesUnsubscribe();
            this.entriesUnsubscribe = null;
        }
        console.log('✅ Real-time data synchronization cleaned up');
    }

    // Navigation functions
    showTab(tabName, clickedElement = null) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Show selected tab
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.style.display = 'block';
        }
        
        // Add active class to clicked nav link or find it by tab name
        if (clickedElement) {
            clickedElement.classList.add('active');
        } else {
            // Find the nav link for this tab and make it active
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(tabName)) {
                    link.classList.add('active');
                }
            });
        }
        
        // Close mobile navigation if it's open
        if (typeof closeMobileNav === 'function') {
            closeMobileNav();
        }
        
        // Load tab-specific content
        switch(tabName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'chart-accounts':
                this.loadAccountsList();
                break;
            case 'journal-entries':
                this.loadJournalEntries();
                break;
            case 'trial-balance':
                this.generateTrialBalance();
                break;
            case 'balance-sheet':
                this.generateBalanceSheet();
                break;
            case 'income-statement':
                this.generateIncomeStatement();
                break;
            case 'about':
                // About page is static, no dynamic loading needed
                break;
        }
    }

    // Dashboard functions
    loadDashboard() {
        this.updateDashboardSummary();
        this.loadRecentEntries();
        this.checkAccountAlerts();
    }

    updateDashboardSummary() {
        const balances = this.calculateAccountBalances();
        
        let totalAssets = 0;
        let totalLiabilities = 0;
        let totalEquity = 0;
        let totalRevenue = 0;
        let totalExpenses = 0;

        this.accounts.forEach(account => {
            const balance = balances[account.id] || 0;
            switch(account.type) {
                case 'Asset':
                    totalAssets += balance;
                    break;
                case 'Liability':
                    totalLiabilities += Math.abs(balance);
                    break;
                case 'Equity':
                    totalEquity += Math.abs(balance);
                    break;
                case 'Revenue':
                    totalRevenue += Math.abs(balance);
                    break;
                case 'Expense':
                    totalExpenses += balance;
                    break;
            }
        });

        const netIncome = totalRevenue - totalExpenses;

        document.getElementById('total-assets').textContent = this.formatCurrency(totalAssets);
        document.getElementById('total-liabilities').textContent = this.formatCurrency(totalLiabilities);
        document.getElementById('total-equity').textContent = this.formatCurrency(totalEquity);
        document.getElementById('net-income').textContent = this.formatCurrency(netIncome);
    }

    loadRecentEntries() {
        const recentContainer = document.getElementById('recent-entries');
        const recentEntries = this.journalEntries.slice(-5).reverse();
        
        if (recentEntries.length === 0) {
            recentContainer.innerHTML = `
                <div class="text-center py-3">
                    <i class="fas fa-clock fa-2x text-muted mb-2"></i>
                    <p class="text-muted mb-2">No recent entries</p>
                    <button class="btn btn-primary btn-sm" onclick="app.loadDemoData()">
                        <i class="fas fa-database"></i> Load Demo Data
                    </button>
                </div>
            `;
            return;
        }

        let html = '';
        recentEntries.forEach(entry => {
            html += `
                <div class="border-bottom pb-2 mb-2">
                    <div class="d-flex justify-content-between">
                        <strong>${entry.description}</strong>
                        <small class="text-muted">${entry.date}</small>
                    </div>
                    <small class="text-muted">Ref: ${entry.reference || 'N/A'}</small>
                </div>
            `;
        });
        
        recentContainer.innerHTML = html;
    }

    checkAccountAlerts() {
        const alertsContainer = document.getElementById('account-alerts');
        
        // Check if there are no accounts
        if (this.accounts.length === 0) {
            alertsContainer.innerHTML = `
                <div class="text-center py-3">
                    <i class="fas fa-info-circle fa-2x text-muted mb-2"></i>
                    <p class="text-muted mb-2">No accounts to monitor</p>
                    <small class="text-muted">Load demo data to see account alerts</small>
                </div>
            `;
            return;
        }
        
        const balances = this.calculateAccountBalances();
        
        // Check for any obvious issues
        let alerts = [];
        
        // Check if trial balance is balanced
        const trialBalance = this.calculateTrialBalance();
        if (Math.abs(trialBalance.totalDebits - trialBalance.totalCredits) > 0.01) {
            alerts.push({
                type: 'danger',
                message: 'Trial balance is out of balance!'
            });
        }
        
        // Check for negative cash
        const cashAccount = this.accounts.find(acc => acc.name.toLowerCase().includes('cash'));
        if (cashAccount) {
            const cashBalance = balances[cashAccount.id] || 0;
            if (cashBalance < 0) {
                alerts.push({
                    type: 'warning',
                    message: 'Cash account has negative balance'
                });
            }
        }

        if (alerts.length === 0) {
            alertsContainer.innerHTML = '<p class="text-success"><i class="fas fa-check"></i> All accounts balanced</p>';
        } else {
            let html = '';
            alerts.forEach(alert => {
                html += `<div class="alert alert-${alert.type} py-2 px-3 mb-2">${alert.message}</div>`;
            });
            alertsContainer.innerHTML = html;
        }
    }

    // Account management functions
    showAddAccountModal() {
        // Set modal to add mode
        this.accountEditMode = false;
        this.editingAccountId = null;
        
        // Update modal title and button
        document.querySelector('#addAccountModal .modal-title').textContent = 'Add New Account';
        document.querySelector('#addAccountModal .btn-primary').textContent = 'Add Account';
        
        // Generate next account number
        const accountNumber = this.generateAccountNumber();
        document.getElementById('accountNumber').value = accountNumber;
        
        // Clear other fields
        document.getElementById('accountName').value = '';
        document.getElementById('accountType').value = '';
        document.getElementById('accountDescription').value = '';
        
        $('#addAccountModal').modal('show');
    }

    // Edit existing account
    editAccount(accountId) {
        // Find the account to edit
        const account = this.accounts.find(acc => acc.id === accountId);
        if (!account) {
            alert('Account not found');
            return;
        }

        // Set modal to edit mode
        this.accountEditMode = true;
        this.editingAccountId = accountId;
        
        // Update modal title and button
        document.querySelector('#addAccountModal .modal-title').textContent = 'Edit Account';
        document.querySelector('#addAccountModal .btn-primary').textContent = 'Update Account';
        
        // Populate form with existing account data
        document.getElementById('accountNumber').value = account.number;
        document.getElementById('accountName').value = account.name;
        document.getElementById('accountType').value = account.type;
        document.getElementById('accountDescription').value = account.description || '';
        
        $('#addAccountModal').modal('show');
    }

    // Reset account modal to default state
    resetAccountModal() {
        this.accountEditMode = false;
        this.editingAccountId = null;
        
        // Reset modal title and button text
        document.querySelector('#addAccountModal .modal-title').textContent = 'Add New Account';
        document.querySelector('#addAccountModal .btn-primary').textContent = 'Add Account';
    }

    generateAccountNumber() {
        // Simple numbering system based on account type
        const existingNumbers = this.accounts.map(acc => parseInt(acc.number)).sort((a, b) => a - b);
        let nextNumber = 1000;
        
        while (existingNumbers.includes(nextNumber)) {
            nextNumber += 100;
        }
        
        return nextNumber.toString();
    }

    addAccount() {
        const number = document.getElementById('accountNumber').value;
        const name = document.getElementById('accountName').value;
        const type = document.getElementById('accountType').value;
        const description = document.getElementById('accountDescription').value;

        // Validation
        if (!number || !name || !type) {
            alert('Please fill in all required fields');
            return;
        }

        // Check for duplicate account numbers (skip current account when editing)
        const duplicateAccount = this.accounts.find(acc => acc.number === number);
        if (duplicateAccount && (!this.accountEditMode || duplicateAccount.id !== this.editingAccountId)) {
            alert('Account number already exists');
            return;
        }

        if (this.accountEditMode && this.editingAccountId) {
            // Update existing account
            const accountIndex = this.accounts.findIndex(acc => acc.id === this.editingAccountId);
            if (accountIndex !== -1) {
                this.accounts[accountIndex] = {
                    ...this.accounts[accountIndex],
                    number: number,
                    name: name,
                    type: type,
                    description: description
                };
                
                this.showNotification('Account updated successfully!', 'success');
            }
        } else {
            // Add new account
            const newAccount = {
                id: this.nextAccountId++,
                number: number,
                name: name,
                type: type,
                description: description
            };

            this.accounts.push(newAccount);
            this.showNotification('Account added successfully!', 'success');
        }

        // Sort accounts and save
        this.accounts.sort((a, b) => a.number.localeCompare(b.number));
        this.saveData();
        
        $('#addAccountModal').modal('hide');
        this.loadAccountsList();
        this.updateAccountSelects();
        
        // Reset edit mode
        this.accountEditMode = false;
        this.editingAccountId = null;
    }

    loadAccountsList() {
        const container = document.getElementById('accounts-list');
        
        // Check if there are no accounts
        if (this.accounts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-list fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No Chart of Accounts Found</h5>
                    <p class="text-muted">Get started by loading demo data or adding your first account.</p>
                    <div class="mt-3">
                        <button class="btn btn-primary me-2" onclick="app.loadDemoData()">
                            <i class="fas fa-database"></i> Load Demo Data
                        </button>
                        <button class="btn btn-outline-secondary" onclick="showAddAccountModal()">
                            <i class="fas fa-plus"></i> Add First Account
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        const accountTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
        let html = '';
        
        accountTypes.forEach(type => {
            const typeAccounts = this.accounts.filter(acc => acc.type === type);
            
            if (typeAccounts.length > 0) {
                html += `<div class="account-type-header">${type} Accounts</div>`;
                
                typeAccounts.forEach(account => {
                    const balance = this.getAccountBalance(account.id);
                    const balanceClass = balance >= 0 ? 'balance-positive' : 'balance-negative';
                    
                    html += `
                        <div class="row py-2 border-bottom align-items-center account-row">
                            <div class="col-2"><strong>${account.number}</strong></div>
                            <div class="col-5">${account.name}</div>
                            <div class="col-3 ${balanceClass}">${this.formatCurrency(balance)}</div>
                            <div class="col-2">
                                <div class="account-actions">
                                    <button class="btn btn-sm btn-outline-primary" onclick="app.editAccount(${account.id})" title="Edit Account">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="app.deleteAccount(${account.id})" title="Delete Account">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }
        });
        
        container.innerHTML = html;
    }

    // Journal Entry functions
    showAddEntryModal() {
        // Set modal to add mode
        this.entryEditMode = false;
        this.editingEntryId = null;
        
        // Update modal title and button
        document.querySelector('#addEntryModal .modal-title').textContent = 'New Journal Entry';
        document.querySelector('#addEntryModal .btn-primary').textContent = 'Save Entry';
        
        // Clear form
        const entryDateElement = document.getElementById('entryDate');
        const entryReferenceElement = document.getElementById('entryReference');
        const entryDescriptionElement = document.getElementById('entryDescription');
        
        if (entryDateElement) {
            entryDateElement.value = new Date().toISOString().split('T')[0];
        }
        if (entryReferenceElement) {
            entryReferenceElement.value = '';
        }
        if (entryDescriptionElement) {
            entryDescriptionElement.value = '';
        }
        
        // Reset transaction lines
        const container = document.getElementById('transaction-lines');
        if (container) {
            container.innerHTML = this.createTransactionLine();
        }
        
        this.updateAccountSelects();
        this.updateTotals();
        
        $('#addEntryModal').modal('show');
    }

    // Edit existing journal entry
    editJournalEntry(entryId) {
        // Find the journal entry to edit
        const entry = this.journalEntries.find(ent => ent.id === entryId);
        if (!entry) {
            alert('Journal entry not found');
            return;
        }

        // Set modal to edit mode
        this.entryEditMode = true;
        this.editingEntryId = entryId;
        
        // Update modal title and button
        document.querySelector('#addEntryModal .modal-title').textContent = 'Edit Journal Entry';
        document.querySelector('#addEntryModal .btn-primary').textContent = 'Update Entry';
        
        // Populate form with existing entry data
        document.getElementById('entryDate').value = entry.date;
        document.getElementById('entryReference').value = entry.reference || '';
        document.getElementById('entryDescription').value = entry.description;
        
        // Clear existing transaction lines and create new ones
        const container = document.getElementById('transaction-lines');
        container.innerHTML = '';
        
        // Add transaction lines with existing data
        entry.transactions.forEach((transaction, index) => {
            if (index === 0) {
                // For first line, create with existing data
                container.innerHTML = this.createTransactionLine();
                const firstLine = container.querySelector('.transaction-line');
                firstLine.querySelector('.account-select').value = transaction.accountId;
                firstLine.querySelector('.debit-amount').value = transaction.debit || '';
                firstLine.querySelector('.credit-amount').value = transaction.credit || '';
            } else {
                // For additional lines, add new ones
                container.insertAdjacentHTML('beforeend', this.createTransactionLine());
                const newLine = container.lastElementChild;
                newLine.querySelector('.account-select').value = transaction.accountId;
                newLine.querySelector('.debit-amount').value = transaction.debit || '';
                newLine.querySelector('.credit-amount').value = transaction.credit || '';
            }
        });
        
        // Update account selects and totals
        this.updateAccountSelects();
        this.updateTotals();
        
        $('#addEntryModal').modal('show');
    }

    // Reset journal entry modal to default state
    resetEntryModal() {
        this.entryEditMode = false;
        this.editingEntryId = null;
        
        // Reset modal title and button text
        document.querySelector('#addEntryModal .modal-title').textContent = 'New Journal Entry';
        document.querySelector('#addEntryModal .btn-primary').textContent = 'Save Entry';
    }

    createTransactionLine() {
        const accountOptions = this.accounts.map(acc => 
            `<option value="${acc.id}">${acc.number} - ${acc.name}</option>`
        ).join('');
        
        return `
            <div class="transaction-line">
                <div class="row">
                    <div class="col-12 col-md-6">
                        <div class="form-group">
                            <label>Account</label>
                            <select class="form-control account-select" required>
                                <option value="">Select Account</option>
                                ${accountOptions}
                            </select>
                        </div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="form-group">
                            <label>Debit</label>
                            <input type="number" step="0.01" class="form-control debit-amount" onchange="app.updateTotals()">
                        </div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="form-group">
                            <label>Credit</label>
                            <input type="number" step="0.01" class="form-control credit-amount" onchange="app.updateTotals()">
                        </div>
                    </div>
                    <div class="col-12 text-right">
                        <button type="button" class="btn btn-sm btn-danger" onclick="app.removeTransactionLine(this)">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    addTransactionLine() {
        const container = document.getElementById('transaction-lines');
        container.insertAdjacentHTML('beforeend', this.createTransactionLine());
        this.updateTotals();
    }

    removeTransactionLine(button) {
        const container = document.getElementById('transaction-lines');
        if (container.children.length > 1) {
            button.closest('.transaction-line').remove();
            this.updateTotals();
        } else {
            alert('At least one transaction line is required');
        }
    }

    updateAccountSelects() {
        const accountOptions = this.accounts.map(acc => 
            `<option value="${acc.id}">${acc.number} - ${acc.name}</option>`
        ).join('');
        
        document.querySelectorAll('.account-select').forEach(select => {
            const currentValue = select.value;
            select.innerHTML = `<option value="">Select Account</option>${accountOptions}`;
            select.value = currentValue;
        });
    }

    updateTotals() {
        let totalDebits = 0;
        let totalCredits = 0;
        
        document.querySelectorAll('.transaction-line').forEach(line => {
            const debitInput = line.querySelector('.debit-amount');
            const creditInput = line.querySelector('.credit-amount');
            
            const debit = debitInput ? (parseFloat(debitInput.value) || 0) : 0;
            const credit = creditInput ? (parseFloat(creditInput.value) || 0) : 0;
            
            totalDebits += debit;
            totalCredits += credit;
        });
        
        const totalDebitsElement = document.getElementById('total-debits-entry');
        const totalCreditsElement = document.getElementById('total-credits-entry');
        const statusElement = document.getElementById('balance-status');
        const saveButton = document.getElementById('save-entry-btn');
        
        if (totalDebitsElement) {
            totalDebitsElement.textContent = totalDebits.toFixed(2);
        }
        if (totalCreditsElement) {
            totalCreditsElement.textContent = totalCredits.toFixed(2);
        }
        
        const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0;
        
        if (statusElement) {
            if (isBalanced) {
                statusElement.textContent = 'Balanced ✓';
                statusElement.className = 'text-success';
            } else {
                statusElement.textContent = 'Out of Balance';
                statusElement.className = 'text-danger';
            }
        }
        
        if (saveButton) {
            // Allow saving even if unbalanced (removes validation)
            saveButton.disabled = false;
        }
    }

    addJournalEntry() {
        const date = document.getElementById('entryDate').value;
        const reference = document.getElementById('entryReference').value;
        const description = document.getElementById('entryDescription').value;
        
        if (!date || !description) {
            alert('Please fill in date and description');
            return;
        }
        
        const transactions = [];
        document.querySelectorAll('.transaction-line').forEach(line => {
            const accountId = parseInt(line.querySelector('.account-select').value);
            const debit = parseFloat(line.querySelector('.debit-amount').value) || 0;
            const credit = parseFloat(line.querySelector('.credit-amount').value) || 0;
            
            if (accountId && (debit > 0 || credit > 0)) {
                transactions.push({
                    accountId: accountId,
                    debit: debit,
                    credit: credit
                });
            }
        });
        
        if (transactions.length < 2) {
            alert('At least two transaction lines are required');
            return;
        }

        if (this.entryEditMode && this.editingEntryId) {
            // Update existing journal entry
            const entryIndex = this.journalEntries.findIndex(entry => entry.id === this.editingEntryId);
            if (entryIndex !== -1) {
                this.journalEntries[entryIndex] = {
                    ...this.journalEntries[entryIndex],
                    date: date,
                    reference: reference,
                    description: description,
                    transactions: transactions,
                    updatedAt: new Date().toISOString()
                };
                
                this.showNotification('Journal entry updated successfully!', 'success');
            }
        } else {
            // Add new journal entry
            const entry = {
                id: this.nextEntryId++,
                date: date,
                reference: reference,
                description: description,
                transactions: transactions,
                createdAt: new Date().toISOString()
            };

            this.journalEntries.push(entry);
            this.showNotification('Journal entry added successfully!', 'success');
        }
        
        this.saveData();
        
        $('#addEntryModal').modal('hide');
        this.loadJournalEntries();
        
        // Reset edit mode
        this.entryEditMode = false;
        this.editingEntryId = null;
        
        // Refresh dashboard if visible
        if (document.getElementById('dashboard').style.display !== 'none') {
            this.loadDashboard();
        }
    }

    loadJournalEntries() {
        const tbody = document.getElementById('journal-entries-table');
        
        if (this.journalEntries.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5">
                        <div>
                            <i class="fas fa-book fa-3x text-muted mb-3"></i>
                            <h6 class="text-muted">No Journal Entries Found</h6>
                            <p class="text-muted small">Start by loading demo data or creating your first journal entry.</p>
                            <div class="mt-3">
                                <button class="btn btn-primary btn-sm me-2" onclick="app.loadDemoData()">
                                    <i class="fas fa-database"></i> Load Demo Data
                                </button>
                                <button class="btn btn-outline-secondary btn-sm" onclick="showAddEntryModal()" ${this.accounts.length === 0 ? 'disabled title="Add accounts first"' : ''}>
                                    <i class="fas fa-plus"></i> Add Entry
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        this.journalEntries.slice().reverse().forEach(entry => {
            entry.transactions.forEach((transaction, index) => {
                const account = this.accounts.find(acc => acc.id === transaction.accountId);
                const isFirstRow = index === 0;
                
                html += `
                    <tr class="transaction-row">
                        <td>${isFirstRow ? entry.date : ''}</td>
                        <td>${isFirstRow ? entry.reference || '' : ''}</td>
                        <td>${isFirstRow ? entry.description : ''}</td>
                        <td>${account ? `${account.number} - ${account.name}` : 'Unknown Account'}</td>
                        <td class="text-right">${transaction.debit > 0 ? this.formatCurrency(transaction.debit) : ''}</td>
                        <td class="text-right">${transaction.credit > 0 ? this.formatCurrency(transaction.credit) : ''}</td>
                        <td>${isFirstRow ? `
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-outline-primary" onclick="editJournalEntry(${entry.id})" title="Edit Entry">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="app.deleteJournalEntry(${entry.id})" title="Delete Entry">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        ` : ''}</td>
                    </tr>
                `;
            });
        });
        
        tbody.innerHTML = html;
    }

    // Financial Reports
    calculateAccountBalances() {
        const balances = {};
        
        // Initialize all accounts with zero balance
        this.accounts.forEach(account => {
            balances[account.id] = 0;
        });
        
        // Process all journal entries
        this.journalEntries.forEach(entry => {
            entry.transactions.forEach(transaction => {
                if (!balances[transaction.accountId]) {
                    balances[transaction.accountId] = 0;
                }
                balances[transaction.accountId] += transaction.debit - transaction.credit;
            });
        });
        
        return balances;
    }

    // Calculate total debits and credits for each account
    calculateAccountTotals() {
        const totals = {};
        
        // Initialize all accounts with zero totals
        this.accounts.forEach(account => {
            totals[account.id] = {
                totalDebits: 0,
                totalCredits: 0,
                netBalance: 0
            };
        });
        
        // Process all journal entries
        this.journalEntries.forEach(entry => {
            entry.transactions.forEach(transaction => {
                if (!totals[transaction.accountId]) {
                    totals[transaction.accountId] = {
                        totalDebits: 0,
                        totalCredits: 0,
                        netBalance: 0
                    };
                }
                totals[transaction.accountId].totalDebits += transaction.debit;
                totals[transaction.accountId].totalCredits += transaction.credit;
                totals[transaction.accountId].netBalance += transaction.debit - transaction.credit;
            });
        });
        
        return totals;
    }

    getAccountBalance(accountId) {
        const balances = this.calculateAccountBalances();
        return balances[accountId] || 0;
    }

    calculateTrialBalance() {
        const balances = this.calculateAccountBalances();
        let totalDebits = 0;
        let totalCredits = 0;
        const trialBalanceData = [];
        
        this.accounts.forEach(account => {
            const balance = balances[account.id] || 0;
            const debitBalance = balance > 0 ? balance : 0;
            const creditBalance = balance < 0 ? Math.abs(balance) : 0;
            
            totalDebits += debitBalance;
            totalCredits += creditBalance;
            
            trialBalanceData.push({
                account: account,
                debitBalance: debitBalance,
                creditBalance: creditBalance
            });
        });
        
        return {
            data: trialBalanceData,
            totalDebits: totalDebits,
            totalCredits: totalCredits
        };
    }

    generateTrialBalance() {
        const trialBalance = this.calculateTrialBalance();
        const tbody = document.getElementById('trial-balance-table');
        
        let html = '';
        trialBalance.data.forEach(item => {
            if (item.debitBalance > 0 || item.creditBalance > 0) {
                html += `
                    <tr>
                        <td>${item.account.number} - ${item.account.name}</td>
                        <td>${item.account.type}</td>
                        <td class="text-right">${item.debitBalance > 0 ? this.formatCurrency(item.debitBalance) : ''}</td>
                        <td class="text-right">${item.creditBalance > 0 ? this.formatCurrency(item.creditBalance) : ''}</td>
                    </tr>
                `;
            }
        });
        
        tbody.innerHTML = html;
        
        document.getElementById('total-debits').textContent = this.formatCurrency(trialBalance.totalDebits);
        document.getElementById('total-credits').textContent = this.formatCurrency(trialBalance.totalCredits);
    }

    generateBalanceSheet() {
        const accountTotals = this.calculateAccountTotals();
        const tbody = document.getElementById('balance-sheet-table');
        const tfoot = document.getElementById('balance-sheet-totals');
        
        let html = '';
        let grandTotalDebits = 0;
        let grandTotalCredits = 0;
        let grandTotalAssets = 0;
        let grandTotalLiabilities = 0;
        let grandTotalEquity = 0;
        
        // Order accounts by type for balance sheet presentation
        const accountTypes = ['Asset', 'Liability', 'Equity'];
        
        accountTypes.forEach(type => {
            const typeAccounts = this.accounts.filter(acc => acc.type === type);
            
            if (typeAccounts.length > 0) {
                // Add type header row
                html += `
                    <tr class="table-secondary">
                        <td colspan="5" class="font-weight-bold">${type.toUpperCase()} ACCOUNTS</td>
                    </tr>
                `;
                
                typeAccounts.forEach(account => {
                    const totals = accountTotals[account.id] || { totalDebits: 0, totalCredits: 0, netBalance: 0 };
                    
                    // Only show accounts with activity
                    if (totals.totalDebits > 0 || totals.totalCredits > 0) {
                        const netBalance = totals.netBalance;
                        const balanceClass = netBalance >= 0 ? 'text-success' : 'text-danger';
                        
                        // For liabilities and equity, show as positive if they have credit balances
                        let displayBalance = netBalance;
                        if ((type === 'Liability' || type === 'Equity') && netBalance < 0) {
                            displayBalance = Math.abs(netBalance);
                        }
                        
                        html += `
                            <tr>
                                <td>${account.number} - ${account.name}</td>
                                <td><span class="badge badge-outline-${this.getTypeColor(type)}">${type}</span></td>
                                <td class="text-right">${this.formatCurrency(totals.totalDebits)}</td>
                                <td class="text-right">${this.formatCurrency(totals.totalCredits)}</td>
                                <td class="text-right ${balanceClass} font-weight-bold">${this.formatCurrency(displayBalance)}</td>
                            </tr>
                        `;
                        
                        // Accumulate totals
                        grandTotalDebits += totals.totalDebits;
                        grandTotalCredits += totals.totalCredits;
                        
                        if (type === 'Asset') {
                            grandTotalAssets += displayBalance;
                        } else if (type === 'Liability') {
                            grandTotalLiabilities += Math.abs(displayBalance);
                        } else if (type === 'Equity') {
                            grandTotalEquity += Math.abs(displayBalance);
                        }
                    }
                });
            }
        });
        
        // Add net income to equity if there's revenue/expense activity
        const netIncome = this.calculateNetIncome();
        if (netIncome !== 0) {
            grandTotalEquity += netIncome;
            html += `
                <tr>
                    <td>Net Income</td>
                    <td><span class="badge badge-outline-info">Equity</span></td>
                    <td class="text-right">-</td>
                    <td class="text-right">-</td>
                    <td class="text-right ${netIncome >= 0 ? 'text-success' : 'text-danger'} font-weight-bold">${this.formatCurrency(netIncome)}</td>
                </tr>
            `;
        }
        
        tbody.innerHTML = html;
        
        // Add totals footer
        tfoot.innerHTML = `
            <tr class="table-info font-weight-bold">
                <td colspan="2">GRAND TOTALS</td>
                <td class="text-right">${this.formatCurrency(grandTotalDebits)}</td>
                <td class="text-right">${this.formatCurrency(grandTotalCredits)}</td>
                <td class="text-right">-</td>
            </tr>
            <tr class="table-warning font-weight-bold">
                <td colspan="4">TOTAL ASSETS</td>
                <td class="text-right">${this.formatCurrency(grandTotalAssets)}</td>
            </tr>
            <tr class="table-warning font-weight-bold">
                <td colspan="4">TOTAL LIABILITIES & EQUITY</td>
                <td class="text-right">${this.formatCurrency(grandTotalLiabilities + grandTotalEquity)}</td>
            </tr>
        `;
    }

    // Helper function to get badge color for account types
    getTypeColor(type) {
        switch(type) {
            case 'Asset': return 'primary';
            case 'Liability': return 'danger';
            case 'Equity': return 'success';
            case 'Revenue': return 'info';
            case 'Expense': return 'warning';
            default: return 'secondary';
        }
    }

    calculateNetIncome() {
        const balances = this.calculateAccountBalances();
        let totalRevenue = 0;
        let totalExpenses = 0;
        
        this.accounts.forEach(account => {
            const balance = balances[account.id] || 0;
            if (account.type === 'Revenue') {
                totalRevenue += Math.abs(balance);
            } else if (account.type === 'Expense') {
                totalExpenses += balance;
            }
        });
        
        return totalRevenue - totalExpenses;
    }

    generateIncomeStatement() {
        const balances = this.calculateAccountBalances();
        const container = document.getElementById('income-statement-content');
        
        let html = '<h5 class="text-center mb-4">Income Statement</h5>';
        
        // Revenue
        html += '<h6>REVENUE</h6>';
        let totalRevenue = 0;
        const revenues = this.accounts.filter(acc => acc.type === 'Revenue');
        
        revenues.forEach(account => {
            const balance = Math.abs(balances[account.id] || 0);
            if (balance !== 0) {
                totalRevenue += balance;
                html += `
                    <div class="d-flex justify-content-between">
                        <span>${account.name}</span>
                        <span>${this.formatCurrency(balance)}</span>
                    </div>
                `;
            }
        });
        
        html += `
            <div class="d-flex justify-content-between font-weight-bold border-top pt-2">
                <span>Total Revenue</span>
                <span>${this.formatCurrency(totalRevenue)}</span>
            </div>
        `;
        
        // Expenses
        html += '<h6 class="mt-4">EXPENSES</h6>';
        let totalExpenses = 0;
        const expenses = this.accounts.filter(acc => acc.type === 'Expense');
        
        expenses.forEach(account => {
            const balance = balances[account.id] || 0;
            if (balance !== 0) {
                totalExpenses += balance;
                html += `
                    <div class="d-flex justify-content-between">
                        <span>${account.name}</span>
                        <span>${this.formatCurrency(balance)}</span>
                    </div>
                `;
            }
        });
        
        html += `
            <div class="d-flex justify-content-between font-weight-bold border-top pt-2">
                <span>Total Expenses</span>
                <span>${this.formatCurrency(totalExpenses)}</span>
            </div>
        `;
        
        // Net Income
        const netIncome = totalRevenue - totalExpenses;
        const netIncomeClass = netIncome >= 0 ? 'text-success' : 'text-danger';
        
        html += `
            <hr>
            <div class="d-flex justify-content-between font-weight-bold ${netIncomeClass}">
                <span>NET INCOME</span>
                <span>${this.formatCurrency(netIncome)}</span>
            </div>
        `;
        
        container.innerHTML = html;
    }

    // Utility functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="close" data-dismiss="alert">
                <span>&times;</span>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    deleteAccount(accountId) {
        if (confirm('Are you sure you want to delete this account? This will also remove all related transactions.')) {
            // Remove account
            this.accounts = this.accounts.filter(acc => acc.id !== accountId);
            
            // Remove related journal entries
            this.journalEntries = this.journalEntries.filter(entry => {
                return !entry.transactions.some(trans => trans.accountId === accountId);
            });
            
            this.saveData();
            this.loadAccountsList();
            this.showNotification('Account deleted successfully!', 'success');
        }
    }

    deleteJournalEntry(entryId) {
        if (confirm('Are you sure you want to delete this journal entry?')) {
            this.journalEntries = this.journalEntries.filter(entry => entry.id !== entryId);
            this.saveData();
            this.loadJournalEntries();
            this.showNotification('Journal entry deleted successfully!', 'success');
            
            // Refresh dashboard if visible
            if (document.getElementById('dashboard').style.display !== 'none') {
                this.loadDashboard();
            }
        }
    }
}

// Global functions for HTML onclick events
let app;

function showTab(tabName) {
    app.showTab(tabName);
}

function showAddAccountModal() {
    app.showAddAccountModal();
}

function addAccount() {
    app.addAccount();
}

function showAddEntryModal() {
    app.showAddEntryModal();
}

function addTransactionLine() {
    app.addTransactionLine();
}

function removeTransactionLine(button) {
    app.removeTransactionLine(button);
}

function updateTotals() {
    app.updateTotals();
}

function addJournalEntry() {
    app.addJournalEntry();
}

function generateTrialBalance() {
    app.generateTrialBalance();
}

function generateBalanceSheet() {
    app.generateBalanceSheet();
}

function generateIncomeStatement() {
    app.generateIncomeStatement();
}

function editJournalEntry(entryId) {
    app.editJournalEntry(entryId);
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', function() {
    app = new AccountingApp();
    
    // Wait for auth system to be ready before proceeding
    const waitForAuthSystem = () => {
        if (window.authSystem && window.authSystem.isReady && window.authSystem.isReady()) {
            console.log('✅ Auth system ready, app initialization complete');
            // Auth system will automatically call app.loadUserData() after login
        } else if (window.authSystem && window.authSystem.isFirebaseReady) {
            console.log('✅ Firebase auth system ready, app initialization complete');
            // Auth system will automatically call app.loadUserData() after login
        } else {
            console.log('⏳ Waiting for auth system to be ready...');
            setTimeout(waitForAuthSystem, 100);
        }
    };
    
    waitForAuthSystem();
});