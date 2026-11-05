const { pool } = require('../../config/db');

const getServiceReview = async (req, res) => {
    try {
        const { serviceId } = req.params;

        // Task: all reviews of one service of this company, newest first,
        // with the reviewer's name and the service's title / category.
        const { rows } = await pool.query(
            `SELECT rv.id,
                    rv.company_id AS company,
                    rv.request_id AS request,
                    rv.rating,
                    rv.comment,
                    rv.created_at AS "createdAt",
                    rv.updated_at AS "updatedAt",
                    json_build_object('id', u.id, 'name', u.name) AS consumer,
                    CASE WHEN s.id IS NULL THEN NULL
                         ELSE json_build_object('id', s.id, 'title', s.title, 'category', s.category)
                    END AS service
               FROM reviews rv
               JOIN consumers u ON u.id = rv.consumer_id
               LEFT JOIN services s ON s.id = rv.service_id
              WHERE rv.company_id = $1
                AND rv.service_id = $2
              ORDER BY rv.created_at DESC`,
            [req.company.id, serviceId]
        );

        res.status(200).json({
            reviews: rows,
        });
    } catch (err) {
        // 22P02 = the serviceId in the URL is not a valid UUID, so there are no reviews
        if (err.code === '22P02') {
            return res.status(200).json({ reviews: [] });
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

        // Task: find the request (we need to know which company it belongs to).
        const found = await pool.query('SELECT id, company_id FROM requests WHERE id = $1', [reqId]);
        const request = found.rows[0];

        if (!request) {
            return res.status(404).json({
                message: 'Request not found',
            });
        }
        if (request.company_id !== req.company.id) {
            return res.status(403).json({
                message: 'You cannot get this review',
            });
        }

        // Task: the review written for this request (if any).
        const { rows } = await pool.query(
            `SELECT id, consumer_id AS consumer, company_id AS company, service_id AS service,
                request_id AS request, rating, comment,
                created_at AS "createdAt", updated_at AS "updatedAt"
               FROM reviews
              WHERE request_id = $1
                AND company_id = $2`,
            [reqId, req.company.id]
        );

        res.status(200).json({
            review: rows[0] || null,
        });
    } catch (err) {
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

const getAllCompanyReviews = async (req, res) => {
    try {
        const companyId = req.company.id;
        const { category, rating, search, page, limit } = req.query;

        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
        const offset = (pageNumber - 1) * limitNumber;

        // null means "no filter" (the SQL below ignores a filter whose value is NULL).
        const categoryFilter = typeof category === 'string' && category ? category : null;
        const ratingNumber = parseInt(rating, 10);
        const ratingFilter = ratingNumber >= 1 && ratingNumber <= 5 ? ratingNumber : null;

        // The search text is wrapped in % for ILIKE; \ % _ typed by the user are escaped so they match literally.
        const searchPattern =
            typeof search === 'string' && search.trim()
                ? `%${search.trim().replace(/[\\%_]/g, '\\$&')}%`
                : null;

        // Task: this company's reviews (newest first, one page at a time),
        // optionally filtered by service category, star rating and comment text.
        const { rows: reviews } = await pool.query(
            `SELECT rv.id,
                    rv.company_id AS company,
                    rv.request_id AS request,
                    rv.rating,
                    rv.comment,
                    rv.created_at AS "createdAt",
                    rv.updated_at AS "updatedAt",
                    json_build_object('id', u.id, 'name', u.name) AS consumer,
                    CASE WHEN s.id IS NULL THEN NULL
                         ELSE json_build_object('id', s.id, 'title', s.title, 'category', s.category)
                    END AS service
               FROM reviews rv
               JOIN consumers u ON u.id = rv.consumer_id
               LEFT JOIN services s ON s.id = rv.service_id
              WHERE rv.company_id = $1
                AND ($2::text IS NULL OR s.category = $2)
                AND ($3::int  IS NULL OR rv.rating = $3)
                AND ($4::text IS NULL OR rv.comment ILIKE $4)
              ORDER BY rv.created_at DESC
              LIMIT $5 OFFSET $6`,
            [companyId, categoryFilter, ratingFilter, searchPattern, limitNumber, offset]
        );

        // Task: average rating and number of reviews that match the same filters.
        const statsResult = await pool.query(
            `SELECT COALESCE(AVG(rv.rating), 0)::float8 AS "avgRating",
                    COUNT(*) AS total
               FROM reviews rv
               LEFT JOIN services s ON s.id = rv.service_id
              WHERE rv.company_id = $1
                AND ($2::text IS NULL OR s.category = $2)
                AND ($3::int  IS NULL OR rv.rating = $3)
                AND ($4::text IS NULL OR rv.comment ILIKE $4)`,
            [companyId, categoryFilter, ratingFilter, searchPattern]
        );

        // Task: how many reviews have 5 stars, 4 stars ... (same filters).
        const distributionResult = await pool.query(
            `SELECT rv.rating, COUNT(*) AS count
               FROM reviews rv
               LEFT JOIN services s ON s.id = rv.service_id
              WHERE rv.company_id = $1
                AND ($2::text IS NULL OR s.category = $2)
                AND ($3::int  IS NULL OR rv.rating = $3)
                AND ($4::text IS NULL OR rv.comment ILIKE $4)
              GROUP BY rv.rating
              ORDER BY rv.rating DESC`,
            [companyId, categoryFilter, ratingFilter, searchPattern]
        );

        // Task: for every service category: average rating, number of reviews and the
        // number of reviews per star (not affected by the filters above).
        // The inner query counts reviews per (category, rating); the outer query combines
        // those counts into one row per category.
        const categoryResult = await pool.query(
            `SELECT category,
                    SUM(count)::int                           AS total,
                    SUM(rating * count)::float8 / SUM(count)  AS "avgRating",
                    jsonb_object_agg(rating, count)           AS distribution
               FROM (SELECT s.category, rv.rating, COUNT(*) AS count
                       FROM reviews rv
                       JOIN services s ON s.id = rv.service_id
                      WHERE rv.company_id = $1
                      GROUP BY s.category, rv.rating) AS per_rating
              GROUP BY category`,
            [companyId]
        );

        const stats = {
            avgRating: statsResult.rows[0].avgRating,
            total: statsResult.rows[0].total,
        };

        res.json({
            success: true,
            stats,
            overallDistribution: distributionResult.rows,
            categoryStats: categoryResult.rows,
            reviews,
            pagination: {
                currentPage: pageNumber,
                limit: limitNumber,
                total: stats.total,
                totalPages: Math.ceil(stats.total / limitNumber),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getServiceReview,
    getRequestReview,
    getAllCompanyReviews,
};
