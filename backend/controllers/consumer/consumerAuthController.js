const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/db');
const { hashPassword, verifyPassword } = require('../../utils/password');

const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const signAccessToken = (id) => jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
const signRefreshToken = (id) => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

const postConsumerRegister = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ message: 'Invalid input' });
        }

        // Task: is this email already registered?
        const existing = await pool.query('SELECT id FROM consumers WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({
                message: 'email already exist',
            });
        }

        // The id is generated here so the tokens can be signed before the single INSERT.
        const id = crypto.randomUUID();
        const accessToken = signAccessToken(id);
        const refreshToken = signRefreshToken(id);
        const { salt, hash } = hashPassword(password);

        // Task: create the new consumer.
        // RETURNING sends back the new row (without hash / salt / refresh_token).
        const result = await pool.query(
            `INSERT INTO consumers (id, name, email, phone, hash, salt, refresh_token)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, name, email, phone, address, created_at AS "createdAt", updated_at AS "updatedAt"`,
            [id, name, email, String(phone), hash, salt, refreshToken]
        );

        res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

        res.status(201).json({
            success: true,
            message: 'Consumer registered successfully',
            newConsumerData: result.rows[0],
            accessToken,
        });
    } catch (error) {
        // 23505 = unique violation (two people registered the same email at the same moment)
        if (error.code === '23505') {
            return res.status(409).json({ message: 'email already exist' });
        }
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const postConsumerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required...' });
        }
        if (typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ message: 'Invalid input' });
        }

        // Task: find the consumer by email (hash and salt are needed to check the password).
        const { rows } = await pool.query(
            `SELECT id, name, email, phone, address, created_at AS "createdAt", updated_at AS "updatedAt", hash, salt
               FROM consumers
              WHERE email = $1`,
            [email]
        );
        const consumer = rows[0];

        if (!consumer) {
            return res.status(404).json({
                message: 'Consumer not found.',
            });
        }

        const isValid = verifyPassword(password, consumer.salt, consumer.hash);

        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const accessToken = signAccessToken(consumer.id);
        const refreshToken = signRefreshToken(consumer.id);

        // Task: remember the new refresh token.
        await pool.query('UPDATE consumers SET refresh_token = $1 WHERE id = $2', [refreshToken, consumer.id]);

        res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

        // Everything except the password hash and salt is safe to send to the browser.
        const { hash, salt, ...consumerData } = consumer;

        res.status(200).json({
            success: true,
            message: 'Login successfull',
            consumerData,
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
                message: 'Invalid refresh token',
            });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Task: load the stored refresh token of this consumer.
        const { rows } = await pool.query('SELECT id, refresh_token FROM consumers WHERE id = $1', [decoded.id]);
        const consumer = rows[0];

        if (!consumer) {
            return res.status(401).json({
                message: 'Consumer not found',
            });
        }

        if (consumer.refresh_token !== refreshToken) {
            return res.status(401).json({
                message: 'Invalid refresh token',
            });
        }

        res.json({ accessToken: signAccessToken(consumer.id) });
    } catch (err) {
        res.status(401).json({
            message: 'Invalid token',
        });
    }
};

const postConsumerLogout = async (req, res) => {
    try {
        // Task: forget the refresh token so it cannot be used again.
        await pool.query('UPDATE consumers SET refresh_token = NULL WHERE id = $1', [req.consumer.id]);

        res.clearCookie('refreshToken');
        res.json({
            success: true,
            message: 'Logged Out',
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

module.exports = {
    postConsumerRegister,
    postConsumerLogin,
    refreshAccessToken,
    postConsumerLogout,
};
