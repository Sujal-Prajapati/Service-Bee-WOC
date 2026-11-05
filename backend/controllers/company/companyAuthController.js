const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/db');
const { hashPassword, verifyPassword } = require('../../utils/password');

const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: false, // true in production with https
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const signAccessToken = (id) => jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
const signRefreshToken = (id) => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

const postCompanyRegister = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ message: 'Invalid input' });
        }

        // Task: is this email already registered?
        const existing = await pool.query('SELECT id FROM companies WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({
                message: 'Email already exists',
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Invalid email format',
            });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message:
                    'Password must contain 8 characters, uppercase, lowercase, number and special character',
            });
        }


        // The id is generated here so the tokens can be signed before the single INSERT.
        const id = crypto.randomUUID();
        const accessToken = signAccessToken(id);
        const refreshToken = signRefreshToken(id);
        const { salt, hash } = hashPassword(password);

        // Task: create the new company.
        // RETURNING sends back the new row (without hash / salt / refresh_token).
        const result = await pool.query(
            `INSERT INTO companies (id, name, email, phone, hash, salt, refresh_token)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, name, email, phone, address, created_at AS "createdAt", updated_at AS "updatedAt"`,
            [id, name, email, String(phone), hash, salt, refreshToken]
        );

        res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

        res.status(201).json({
            success: true,
            message: 'Company registered successfully',
            companyData: result.rows[0],
            accessToken,
        });
    } catch (error) {
        // 23505 = unique violation (two people registered the same email at the same moment)
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Email already exists' });
        }
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const postCompanyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required...' });
        }
        if (typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ message: 'Invalid input' });
        }

        // Task: find the company by email (hash and salt are needed to check the password).
        const { rows } = await pool.query(
            `SELECT id, name, email, phone, address, created_at AS "createdAt", updated_at AS "updatedAt", hash, salt
               FROM companies
              WHERE email = $1`,
            [email]
        );
        const company = rows[0];

        if (!company) {
            return res.status(404).json({
                message: 'Company not found.',
            });
        }

        const isValid = verifyPassword(password, company.salt, company.hash);

        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const accessToken = signAccessToken(company.id);
        const refreshToken = signRefreshToken(company.id);

        // Task: remember the new refresh token.
        await pool.query('UPDATE companies SET refresh_token = $1 WHERE id = $2', [refreshToken, company.id]);

        res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

        res.status(200).json({
            success: true,
            message: 'Login successfull',
            accessToken,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: 'No refresh token found',
            });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Task: load the stored refresh token of this company.
        const { rows } = await pool.query('SELECT id, refresh_token FROM companies WHERE id = $1', [decoded.id]);
        const company = rows[0];

        if (!company) {
            return res.status(401).json({
                message: 'Company not found',
            });
        }

        if (company.refresh_token !== refreshToken) {
            return res.status(401).json({
                message: 'Invalid refresh token',
            });
        }

        res.json({ accessToken: signAccessToken(company.id) });
    } catch (err) {
        res.status(401).json({
            success: false,
            message: 'Invalid refresh token',
        });
    }
};

const postCompanyLogout = async (req, res) => {
    try {
        // Task: forget the refresh token so it cannot be used again.
        await pool.query('UPDATE companies SET refresh_token = NULL WHERE id = $1', [req.company.id]);

        res.clearCookie('refreshToken');
        res.json({
            success: true,
            message: 'Logged out',
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

module.exports = {
    postCompanyRegister,
    postCompanyLogin,
    refreshAccessToken,
    postCompanyLogout,
};
