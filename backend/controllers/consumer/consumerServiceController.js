const { pool } = require('../../config/db');

const getConsumerServices = async (req, res) => {
    try {
        // Task: every service, together with the name of the company that offers it.
        const { rows } = await pool.query(
            `SELECT s.id, s.title, s.category, s.description, s.price, s.location, s.image,
                    s.is_available AS "isAvailable",
                    s.created_at   AS "createdAt",
                    s.updated_at   AS "updatedAt",
                    json_build_object('id', c.id, 'name', c.name) AS company
               FROM services s
               JOIN companies c ON c.id = s.company_id
              ORDER BY s.created_at ASC`
        );
        res.status(200).json({
            success: true,
            services: rows,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const getServiceDetail = async (req, res) => {
    try {
        const { id } = req.params;

        // Task: one service by id.
        const { rows } = await pool.query(
            `SELECT id, company_id AS company, title, category, description, price, location, image,
                is_available AS "isAvailable", created_at AS "createdAt", updated_at AS "updatedAt"
               FROM services
              WHERE id = $1`,
            [id]
        );
        const existingService = rows[0];

        if (!existingService) {
            return res.status(404).json({
                message: 'Service does not exist...',
            });
        }

        if (!existingService.isAvailable) {
            return res.status(404).json({
                success: false,
                message: 'This service is currently unavailable',
            });
        }

        res.status(200).json({
            success: true,
            existingService,
        });
    } catch (err) {
        // 22P02 = the id in the URL is not a valid UUID, so no such service exists
        if (err.code === '22P02') {
            return res.status(404).json({ message: 'Service does not exist...' });
        }
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

module.exports = {
    getConsumerServices,
    getServiceDetail,
};
