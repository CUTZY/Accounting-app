# Fung's Acct

A comprehensive web-based general ledger accounting application built with HTML, CSS, and JavaScript. This application implements double-entry bookkeeping principles and provides all essential accounting features for small to medium businesses. **Now includes complete restaurant business demo data** with realistic transactions, accounts, and financial reports.

## Features

### 📊 Dashboard
- Real-time financial summary (Assets, Liabilities, Equity, Net Income)
- Recent journal entries overview
- Account alerts and notifications
- Quick action buttons for common tasks

### 📋 Chart of Accounts
- Pre-loaded standard chart of accounts
- Account management (Add, Edit, Delete)
- Organized by account types: Assets, Liabilities, Equity, Revenue, Expenses
- Real-time account balances
- Automatic account numbering system

### 📖 Journal Entries
- Double-entry bookkeeping system
- Multi-line transaction support
- Real-time balance validation
- Date and reference tracking
- Transaction history with full audit trail

### 📈 Financial Reports
- **Trial Balance**: Validates that debits equal credits
- **Balance Sheet**: Assets vs. Liabilities & Equity
- **Income Statement**: Revenue vs. Expenses with Net Income calculation

### 🔧 Technical Features
- Local storage for data persistence
- Responsive Bootstrap UI
- Real-time calculations
- Form validation
- Professional accounting principles

## Demo Data

🍽️ **Restaurant Business Demo** - The application now includes comprehensive demo data for a small restaurant business featuring:

- **27 Restaurant-Specific Accounts**: Cash, Bank Account, Food/Beverage Inventory, Kitchen Equipment, Furniture, and all typical restaurant accounts
- **20 Realistic Transactions**: Owner investment, equipment purchases, daily sales, cost of goods sold, payroll, rent, utilities, and more
- **Complete Financial Picture**: From startup investment through daily operations
- **Professional References**: Each transaction includes proper reference numbers and descriptions

### Demo Transactions Include:
- Owner's initial $50,000 investment
- Kitchen equipment purchase ($25,000)
- Daily sales with cash and card payments
- Food and beverage inventory management
- Staff payroll and operating expenses
- Monthly rent, utilities, and insurance
- Marketing campaigns and equipment maintenance

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server setup required - runs entirely in the browser

### Installation
1. Download or clone the project files
2. Open `index.html` in your web browser
3. The application will automatically load with restaurant demo data
4. Click "Demo Data" button anytime to reload fresh demo data

## How to Use

### 1. Initial Setup
When you first open the application, it will automatically create a standard chart of accounts including:
- **Assets**: Cash, Accounts Receivable, Inventory, Equipment
- **Liabilities**: Accounts Payable, Notes Payable
- **Equity**: Owner's Equity, Retained Earnings
- **Revenue**: Sales Revenue, Service Revenue
- **Expenses**: Cost of Goods Sold, Rent, Utilities, Office Supplies

### 2. Adding Accounts
1. Navigate to **Chart of Accounts**
2. Click **Add Account**
3. Enter account details:
   - Account Number (auto-generated)
   - Account Name
   - Account Type
   - Description
4. Click **Add Account**

### 3. Recording Journal Entries
1. Navigate to **Journal Entries**
2. Click **New Entry**
3. Fill in entry details:
   - Date
   - Reference (optional)
   - Description
4. Add transaction lines:
   - Select account
   - Enter debit or credit amount
   - Add more lines as needed
5. Ensure debits equal credits (required for saving)
6. Click **Save Entry**

### 4. Viewing Reports
- **Trial Balance**: Shows all account balances and verifies books are balanced
- **Balance Sheet**: Financial position at a point in time
- **Income Statement**: Profitability over a period

## Example Transactions

### Recording Daily Restaurant Sales
```
Date: 2024-01-15
Description: Daily sales - opening day

Account                    Debit    Credit
Cash                       $850
Bank Account              $1,200
Food Sales                          $1,640
Beverage Sales                       $280
Sales Tax Payable                    $130
```

### Recording Food Costs
```
Date: 2024-01-15
Description: Cost of goods sold - opening day

Account                    Debit    Credit
Food Costs                 $520
Beverage Costs             $85
Food Inventory                      $520
Beverage Inventory                  $85
```

### Recording Staff Payroll
```
Date: 2024-01-21
Description: Weekly payroll - kitchen and service staff

Account                    Debit    Credit
Wages & Salaries          $2,800
Bank Account                       $2,800
```

### Recording Kitchen Equipment Purchase
```
Date: 2024-01-02
Description: Purchase kitchen equipment

Account                    Debit    Credit
Kitchen Equipment        $25,000
Bank Account                      $15,000
Equipment Loan                    $10,000
```

## Accounting Principles

This application follows standard accounting principles:

- **Double-Entry Bookkeeping**: Every transaction affects at least two accounts
- **Accounting Equation**: Assets = Liabilities + Equity
- **Debit/Credit Rules**:
  - Assets: Debit increases, Credit decreases
  - Liabilities: Credit increases, Debit decreases
  - Equity: Credit increases, Debit decreases
  - Revenue: Credit increases, Debit decreases
  - Expenses: Debit increases, Credit decreases

## Data Storage

- All data is stored locally in your browser's localStorage
- Data persists between browser sessions
- No external database required
- **Important**: Clearing browser data will remove all accounting records

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## File Structure

```
accounting-app/
├── index.html          # Main application interface
├── app.js             # Application logic and functionality
└── README.md          # This documentation
```

## Troubleshooting

### Data Not Saving
- Ensure JavaScript is enabled in your browser
- Check browser console for errors
- Try refreshing the page

### Reports Not Calculating
- Verify all journal entries are balanced
- Check that accounts are properly categorized
- Refresh the specific report tab

### UI Issues
- Ensure you have an internet connection (for Bootstrap/FontAwesome CDN)
- Try clearing browser cache
- Check browser compatibility

## Advanced Features

### Account Numbering System
- Assets: 1000-1999
- Liabilities: 2000-2999
- Equity: 3000-3999
- Revenue: 4000-4999
- Expenses: 5000-6999

### Data Export/Import
Currently, data is stored in localStorage. For backup:
1. Open browser developer tools (F12)
2. Go to Application/Storage tab
3. Export localStorage data for backup

## Future Enhancements

Potential improvements for future versions:
- CSV/Excel export functionality
- Multi-company support
- User authentication
- Database backend integration
- Advanced reporting (Cash Flow, etc.)
- Recurring journal entries
- Account reconciliation

## Support

This is a standalone application that runs entirely in your web browser. For technical issues:
1. Check browser console for JavaScript errors
2. Verify all files are present and accessible
3. Ensure modern browser compatibility

## Author

**Cursor Agent** - Project Developer and Maintainer

## License

This project is provided as-is for educational and business use. Feel free to modify and adapt for your specific needs.

---

**Note**: This application is designed for small to medium business accounting needs. For complex accounting requirements or large-scale operations, consider professional accounting software.