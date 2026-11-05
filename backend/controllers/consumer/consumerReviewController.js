const { pool } = require('../../config/db');

const postCreateServiceReview = async (req, res) => {
    try {
        const { reqId } = req.params;
        const { rating, comment } = req.body;

        const ratingNumber = Number(rating);
        if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
            return res.status(400).json({
                message: 'Rating must be a whole number between 1 and 5',
            });
        }

        // Task: find the request being reviewed.
        const found = await pool.query(
            'SELECT id, consumer_id, company_id, service_id, status FROM requests WHERE id = $1',
            [reqId]
        );
        const request = found.rows[0];

        if (!request) {
            return res.status(404).json({
                message: 'Request not found',
            });
        }

        if (req.consumer.id !== request.consumer_id) {
            return res.status(403).json({
                message: 'You cannot review this request',
            });
        }

        if (request.status !== 'resolved') {
            return res.status(400).json({
                message: 'You can only review resolved request',
            });
        }

        // Task: has this consumer already reviewed this request?
        const existing = await pool.query(
            'SELECT id FROM reviews WHERE request_id = $1 AND consumer_id = $2',
            [reqId, req.consumer.id]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                message: 'You have already reviewed this request',
            });
        }

        // Task: save the review.
        const { rows } = await pool.query(
            `INSERT INTO reviews (consumer_id, company_id, service_id, request_id, rating, comment)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, consumer_id AS consumer, company_id AS company, service_id AS service,
                request_id AS request, rating, comment,
                created_at AS "createdAt", updated_at AS "updatedAt"`,
            [
                req.consumer.id,
                request.company_id,
                request.service_id,
                reqId,
                ratingNumber,
                typeof comment === 'string' ? comment.trim() : '',
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Review created successfully.',
            review: rows[0],
        });
    } catch (err) {
        // 23505 = reviews.request_id is UNIQUE, this catches two simultaneous submissions
        if (err.code === '23505') {
            return res.status(400).json({ message: 'You have already reviewed this request' });
        }
        // 22P02 = the reqId in the URL is not a valid UUID, so no such request exists
        if (err.code === '22P02') {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const getRequestReview = async (req, res) => {
    try {
        const { reqId } = req.params;

        // Task: the review this consumer wrote for this request (if any).
        const { rows } = await pool.query(
            `SELECT id, consumer_id AS consumer, company_id AS company, service_id AS service,
                request_id AS request, rating, comment,
                created_at AS "createdAt", updated_at AS "updatedAt"
               FROM reviews
              WHERE request_id = $1
                AND consumer_id = $2`,
            [reqId, req.consumer.id]
        );

        res.status(200).json({
            review: rows[0] || null,
        });
    } catch (err) {
        // 22P02 = the reqId in the URL is not a valid UUID, so there is no review
        if (err.code === '22P02') {
            return res.status(200).json({ review: null });
        }
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

module.exports = {
    postCreateServiceReview,
    getRequestReview,
};
