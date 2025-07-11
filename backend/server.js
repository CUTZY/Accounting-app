// Fung's Accounting App - Node.js Backend Server
// Complete API server with SQLite database integration

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
const DB_PATH = path.join(__dirname, 'accounting.db');

// Database initialization
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    const tables = [
        // Users table
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(100) NOT NULL,
            business_name VARCHAR(100),
            phone VARCHAR(20),
            address TEXT,
            tax_id VARCHAR(50),
            currency VARCHAR(10) DEFAULT 'USD',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Accounts table
        `CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            number VARCHAR(20) NOT NULL,
            name VARCHAR(100) NOT NULL,
            type VARCHAR(20) NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,
        
        // Journal entries table
        `CREATE TABLE IF NOT EXISTS journal_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date DATE NOT NULL,
            reference VARCHAR(50),
            description TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,
        
        // Transactions table
        `CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_id INTEGER NOT NULL,
            account_id INTEGER NOT NULL,
            debit DECIMAL(10,2) DEFAULT 0.00,
            credit DECIMAL(10,2) DEFAULT 0.00,
            FOREIGN KEY (entry_id) REFERENCES journal_entries (id) ON DELETE CASCADE,
            FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
        )`,
        
        // Sessions table for token blacklisting
        `CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token_hash VARCHAR(255) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`
    ];

    tables.forEach(table => {
        db.run(table, (err) => {
            if (err) {
                console.error('❌ Error creating table:', err.message);
            }
        });
    });

    console.log('✅ Database tables initialized');
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Auth rate limiting (stricter)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // limit each IP to 5 auth requests per 15 minutes
    message: 'Too many authentication attempts, please try again later.'
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Validation middleware
const validateRegistration = [
    body('username').isLength({ min: 3 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').isLength({ min: 2 }).trim().escape(),
    body('businessName').optional().trim().escape()
];

const validateLogin = [
    body('username').trim().escape(),
    body('password').isLength({ min: 1 })
];

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: 'Connected'
    });
});

// User Registration
app.post('/api/auth/register', authLimiter, validateRegistration, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Validation failed', details: errors.array() });
        }

        const { username, email, password, fullName, businessName } = req.body;

        // Check if user already exists
        db.get(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email],
            async (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                if (row) {
                    return res.status(400).json({ error: 'Username or email already exists' });
                }

                // Hash password
                const passwordHash = await bcrypt.hash(password, 12);

                // Insert new user
                db.run(
                    `INSERT INTO users (username, email, password_hash, full_name, business_name) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [username, email, passwordHash, fullName, businessName || fullName + "'s Business"],
                    function(err) {
                        if (err) {
                            console.error('Insert error:', err);
                            return res.status(500).json({ error: 'Failed to create user' });
                        }

                        // Generate JWT token
                        const token = jwt.sign(
                            { userId: this.lastID, username, email },
                            JWT_SECRET,
                            { expiresIn: '24h' }
                        );

                        res.status(201).json({
                            success: true,
                            message: `Welcome ${fullName}! Your account has been created.`,
                            token,
                            user: {
                                id: this.lastID,
                                username,
                                email,
                                fullName,
                                businessName: businessName || fullName + "'s Business"
                            }
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User Login
app.post('/api/auth/login', authLimiter, validateLogin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Validation failed', details: errors.array() });
        }

        const { username, password } = req.body;

        // Find user by username or email
        db.get(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username],
            async (err, user) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!user) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                // Verify password
                const validPassword = await bcrypt.compare(password, user.password_hash);
                if (!validPassword) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                // Generate JWT token
                const token = jwt.sign(
                    { userId: user.id, username: user.username, email: user.email },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                res.json({
                    success: true,
                    message: `Welcome back, ${user.full_name}!`,
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        fullName: user.full_name,
                        businessName: user.business_name,
                        phone: user.phone,
                        address: user.address,
                        taxId: user.tax_id,
                        currency: user.currency
                    }
                });
            }
        );
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
    db.get(
        'SELECT id, username, email, full_name, business_name, phone, address, tax_id, currency FROM users WHERE id = ?',
        [req.user.userId],
        (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.full_name,
                    businessName: user.business_name,
                    phone: user.phone,
                    address: user.address,
                    taxId: user.tax_id,
                    currency: user.currency
                }
            });
        }
    );
});

// Update user profile
app.put('/api/user/profile', authenticateToken, [
    body('fullName').optional().isLength({ min: 2 }).trim().escape(),
    body('businessName').optional().trim().escape(),
    body('phone').optional().trim().escape(),
    body('address').optional().trim(),
    body('taxId').optional().trim().escape(),
    body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { fullName, businessName, phone, address, taxId, currency } = req.body;
    const updates = [];
    const values = [];

    if (fullName) { updates.push('full_name = ?'); values.push(fullName); }
    if (businessName) { updates.push('business_name = ?'); values.push(businessName); }
    if (phone) { updates.push('phone = ?'); values.push(phone); }
    if (address) { updates.push('address = ?'); values.push(address); }
    if (taxId) { updates.push('tax_id = ?'); values.push(taxId); }
    if (currency) { updates.push('currency = ?'); values.push(currency); }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user.userId);

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    db.run(sql, values, function(err) {
        if (err) {
            console.error('Update error:', err);
            return res.status(500).json({ error: 'Failed to update profile' });
        }

        res.json({ success: true, message: 'Profile updated successfully' });
    });
});

// Get user accounts
app.get('/api/accounts', authenticateToken, (req, res) => {
    db.all(
        'SELECT * FROM accounts WHERE user_id = ? ORDER BY number',
        [req.user.userId],
        (err, accounts) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({ success: true, accounts });
        }
    );
});

// Create account
app.post('/api/accounts', authenticateToken, [
    body('number').isLength({ min: 1 }).trim().escape(),
    body('name').isLength({ min: 1 }).trim().escape(),
    body('type').isIn(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']),
    body('description').optional().trim()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { number, name, type, description } = req.body;

    db.run(
        'INSERT INTO accounts (user_id, number, name, type, description) VALUES (?, ?, ?, ?, ?)',
        [req.user.userId, number, name, type, description || ''],
        function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(400).json({ error: 'Account number already exists' });
                }
                console.error('Insert error:', err);
                return res.status(500).json({ error: 'Failed to create account' });
            }

            res.status(201).json({
                success: true,
                message: 'Account created successfully',
                account: {
                    id: this.lastID,
                    number,
                    name,
                    type,
                    description: description || ''
                }
            });
        }
    );
});

// Get journal entries
app.get('/api/journal-entries', authenticateToken, (req, res) => {
    const sql = `
        SELECT 
            je.*,
            GROUP_CONCAT(
                json_object(
                    'accountId', t.account_id,
                    'debit', t.debit,
                    'credit', t.credit
                )
            ) as transactions
        FROM journal_entries je
        LEFT JOIN transactions t ON je.id = t.entry_id
        WHERE je.user_id = ?
        GROUP BY je.id
        ORDER BY je.date DESC, je.id DESC
    `;

    db.all(sql, [req.user.userId], (err, entries) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Parse transactions JSON
        const formattedEntries = entries.map(entry => ({
            ...entry,
            transactions: entry.transactions ? 
                entry.transactions.split(',').map(t => JSON.parse(t)) : []
        }));

        res.json({ success: true, entries: formattedEntries });
    });
});

// Create journal entry
app.post('/api/journal-entries', authenticateToken, [
    body('date').isISO8601().toDate(),
    body('reference').optional().trim().escape(),
    body('description').isLength({ min: 1 }).trim(),
    body('transactions').isArray({ min: 2 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { date, reference, description, transactions } = req.body;

    // Validate that debits equal credits
    const totalDebits = transactions.reduce((sum, t) => sum + (parseFloat(t.debit) || 0), 0);
    const totalCredits = transactions.reduce((sum, t) => sum + (parseFloat(t.credit) || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
        return res.status(400).json({ error: 'Debits must equal credits' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Insert journal entry
        db.run(
            'INSERT INTO journal_entries (user_id, date, reference, description) VALUES (?, ?, ?, ?)',
            [req.user.userId, date, reference || '', description],
            function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    console.error('Insert error:', err);
                    return res.status(500).json({ error: 'Failed to create journal entry' });
                }

                const entryId = this.lastID;

                // Insert transactions
                const stmt = db.prepare('INSERT INTO transactions (entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?)');
                
                let transactionErrors = 0;
                transactions.forEach(transaction => {
                    stmt.run([
                        entryId,
                        transaction.accountId,
                        parseFloat(transaction.debit) || 0,
                        parseFloat(transaction.credit) || 0
                    ], (err) => {
                        if (err) {
                            transactionErrors++;
                            console.error('Transaction insert error:', err);
                        }
                    });
                });

                stmt.finalize((err) => {
                    if (err || transactionErrors > 0) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Failed to create transactions' });
                    }

                    db.run('COMMIT');
                    res.status(201).json({
                        success: true,
                        message: 'Journal entry created successfully',
                        entryId
                    });
                });
            }
        );
    });
});

// Delete account
app.delete('/api/accounts/:id', authenticateToken, (req, res) => {
    const accountId = parseInt(req.params.id);

    db.run(
        'DELETE FROM accounts WHERE id = ? AND user_id = ?',
        [accountId, req.user.userId],
        function(err) {
            if (err) {
                console.error('Delete error:', err);
                return res.status(500).json({ error: 'Failed to delete account' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Account not found' });
            }

            res.json({ success: true, message: 'Account deleted successfully' });
        }
    );
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Fung's Accounting API Server running on port ${PORT}`);
    console.log(`📊 Database: ${DB_PATH}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n📴 Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});