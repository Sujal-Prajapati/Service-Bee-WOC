const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const authCompany = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'No token found' });
        }
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        // Task: load the logged-in company.
        // hash, salt and refresh_token are deliberately NOT selected, so they can never leak.
        const { rows } = await pool.query(
            `SELECT id, name, email, phone, address, created_at AS "createdAt", updated_at AS "updatedAt"
               FROM companies
              WHERE id = $1`,
            [decoded.id]
        );
        const company = rows[0];

        if (!company) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        req.company = company;

        next();
    } catch (err) {
        res.status(401).json({ message: 'Unauthorized' });
    }
};

module.exports = authCompany;
