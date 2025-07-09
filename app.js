// General Ledger Accounting App - JavaScript
// Data storage and management

class AccountingApp {
    constructor() {
        this.accounts = JSON.parse(localStorage.getItem('gl_accounts')) || [];
        this.journalEntries = JSON.parse(localStorage.getItem('gl_journal_entries')) || [];
        this.nextEntryId = parseInt(localStorage.getItem('gl_next_entry_id')) || 1;
        this.nextAccountId = parseInt(localStorage.getItem('gl_next_account_id')) || 1;
        
        this.initializeApp();
    }

    // Initialize the application
    initializeApp() {
        // Load initial data if empty
        if (this.accounts.length === 0) {
            this.loadDefaultAccounts();
        }
        
        // Set today's date as default (only if element exists)
        const entryDateElement = document.getElementById('entryDate');
        if (entryDateElement) {
            const today = new Date().toISOString().split('T')[0];
            entryDateElement.value = today;
        }
        
        // Load the dashboard
        this.loadDashboard();
        this.loadAccountsList();
        this.loadJournalEntries();
    }

    // Load default chart of accounts
    loadDefaultAccounts() {
        const defaultAccounts = [
            { id: 1, number: '1000', name: 'Cash', type: 'Asset', description: 'Cash on hand and in banks' },
            { id: 2, number: '1200', name: 'Accounts Receivable', type: 'Asset', description: 'Money owed by customers' },
            { id: 3, number: '1500', name: 'Inventory', type: 'Asset', description: 'Goods held for sale' },
            { id: 4, number: '1700', name: 'Equipment', type: 'Asset', description: 'Office and business equipment' },
            { id: 5, number: '2000', name: 'Accounts Payable', type: 'Liability', description: 'Money owed to suppliers' },
            { id: 6, number: '2500', name: 'Notes Payable', type: 'Liability', description: 'Loans and promissory notes' },
            { id: 7, number: '3000', name: 'Owners Equity', type: 'Equity', description: 'Owner\'s investment in the business' },
            { id: 8, number: '3500', name: 'Retained Earnings', type: 'Equity', description: 'Accumulated profits' },
            { id: 9, number: '4000', name: 'Sales Revenue', type: 'Revenue', description: 'Income from sales' },
            { id: 10, number: '4500', name: 'Service Revenue', type: 'Revenue', description: 'Income from services' },
            { id: 11, number: '5000', name: 'Cost of Goods Sold', type: 'Expense', description: 'Direct costs of products sold' },
            { id: 12, number: '6000', name: 'Rent Expense', type: 'Expense', description: 'Monthly rent payments' },
            { id: 13, number: '6100', name: 'Utilities Expense', type: 'Expense', description: 'Electricity, water, gas' },
            { id: 14, number: '6200', name: 'Office Supplies Expense', type: 'Expense', description: 'Office supplies and materials' }
        ];

        this.accounts = defaultAccounts;
        this.nextAccountId = 15;
        this.saveData();
    }

    // Save data to localStorage
    saveData() {
        localStorage.setItem('gl_accounts', JSON.stringify(this.accounts));
        localStorage.setItem('gl_journal_entries', JSON.stringify(this.journalEntries));
        localStorage.setItem('gl_next_entry_id', this.nextEntryId.toString());
        localStorage.setItem('gl_next_account_id', this.nextAccountId.toString());
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
            recentContainer.innerHTML = '<p class="text-muted text-center">No recent entries found</p>';
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
        // Generate next account number
        const accountNumber = this.generateAccountNumber();
        document.getElementById('accountNumber').value = accountNumber;
        
        // Clear other fields
        document.getElementById('accountName').value = '';
        document.getElementById('accountType').value = '';
        document.getElementById('accountDescription').value = '';
        
        $('#addAccountModal').modal('show');
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

        // Check for duplicate account numbers
        if (this.accounts.some(acc => acc.number === number)) {
            alert('Account number already exists');
            return;
        }

        const newAccount = {
            id: this.nextAccountId++,
            number: number,
            name: name,
            type: type,
            description: description
        };

        this.accounts.push(newAccount);
        this.accounts.sort((a, b) => a.number.localeCompare(b.number));
        this.saveData();
        
        $('#addAccountModal').modal('hide');
        this.loadAccountsList();
        this.updateAccountSelects();
        
        // Show success message
        this.showNotification('Account added successfully!', 'success');
    }

    loadAccountsList() {
        const container = document.getElementById('accounts-list');
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
                        <div class="row py-2 border-bottom">
                            <div class="col-md-2"><strong>${account.number}</strong></div>
                            <div class="col-md-4">${account.name}</div>
                            <div class="col-md-3 ${balanceClass}">${this.formatCurrency(balance)}</div>
                            <div class="col-md-3">
                                <button class="btn btn-sm btn-outline-primary" onclick="app.editAccount(${account.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="app.deleteAccount(${account.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
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
            saveButton.disabled = !isBalanced;
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
        
        const entry = {
            id: this.nextEntryId++,
            date: date,
            reference: reference,
            description: description,
            transactions: transactions,
            createdAt: new Date().toISOString()
        };
        
        this.journalEntries.push(entry);
        this.saveData();
        
        $('#addEntryModal').modal('hide');
        this.loadJournalEntries();
        this.showNotification('Journal entry added successfully!', 'success');
        
        // Refresh dashboard if visible
        if (document.getElementById('dashboard').style.display !== 'none') {
            this.loadDashboard();
        }
    }

    loadJournalEntries() {
        const tbody = document.getElementById('journal-entries-table');
        
        if (this.journalEntries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No journal entries found</td></tr>';
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
                            <button class="btn btn-sm btn-outline-danger" onclick="app.deleteJournalEntry(${entry.id})">
                                <i class="fas fa-trash"></i>
                            </button>
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
        const balances = this.calculateAccountBalances();
        const assetsSection = document.getElementById('assets-section');
        const liabilitiesEquitySection = document.getElementById('liabilities-equity-section');
        
        // Assets
        let assetsHtml = '';
        let totalAssets = 0;
        
        const assets = this.accounts.filter(acc => acc.type === 'Asset');
        assets.forEach(account => {
            const balance = balances[account.id] || 0;
            if (balance !== 0) {
                totalAssets += balance;
                assetsHtml += `
                    <div class="d-flex justify-content-between">
                        <span>${account.name}</span>
                        <span>${this.formatCurrency(balance)}</span>
                    </div>
                `;
            }
        });
        
        assetsHtml += `
            <hr>
            <div class="d-flex justify-content-between font-weight-bold">
                <span>TOTAL ASSETS</span>
                <span>${this.formatCurrency(totalAssets)}</span>
            </div>
        `;
        
        // Liabilities and Equity
        let liabilitiesEquityHtml = '';
        let totalLiabilities = 0;
        let totalEquity = 0;
        
        // Liabilities
        liabilitiesEquityHtml += '<h6>LIABILITIES</h6>';
        const liabilities = this.accounts.filter(acc => acc.type === 'Liability');
        liabilities.forEach(account => {
            const balance = Math.abs(balances[account.id] || 0);
            if (balance !== 0) {
                totalLiabilities += balance;
                liabilitiesEquityHtml += `
                    <div class="d-flex justify-content-between">
                        <span>${account.name}</span>
                        <span>${this.formatCurrency(balance)}</span>
                    </div>
                `;
            }
        });
        
        // Equity
        liabilitiesEquityHtml += '<h6 class="mt-3">EQUITY</h6>';
        const equity = this.accounts.filter(acc => acc.type === 'Equity');
        equity.forEach(account => {
            const balance = Math.abs(balances[account.id] || 0);
            if (balance !== 0) {
                totalEquity += balance;
                liabilitiesEquityHtml += `
                    <div class="d-flex justify-content-between">
                        <span>${account.name}</span>
                        <span>${this.formatCurrency(balance)}</span>
                    </div>
                `;
            }
        });
        
        // Add net income to equity
        const netIncome = this.calculateNetIncome();
        if (netIncome !== 0) {
            totalEquity += netIncome;
            liabilitiesEquityHtml += `
                <div class="d-flex justify-content-between">
                    <span>Net Income</span>
                    <span>${this.formatCurrency(netIncome)}</span>
                </div>
            `;
        }
        
        liabilitiesEquityHtml += `
            <hr>
            <div class="d-flex justify-content-between font-weight-bold">
                <span>TOTAL LIABILITIES & EQUITY</span>
                <span>${this.formatCurrency(totalLiabilities + totalEquity)}</span>
            </div>
        `;
        
        assetsSection.innerHTML = assetsHtml;
        liabilitiesEquitySection.innerHTML = liabilitiesEquityHtml;
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

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', function() {
    app = new AccountingApp();
});