const { pool } = require('../../config/db');

const isValidPrice = (price) => Number.isFinite(Number(price)) && Number(price) >= 0;

const postAddService = async (req, res) => {
    try {
        const { title, category, description, price, location, image, isAvailable } = req.body;

        if (!title || !category || !description || !price) {
            return res.status(400).json({ message: 'Fill all required fields' });
        }
        if (!isValidPrice(price)) {
            return res.status(400).json({ message: 'Price must be a valid number' });
        }

        // The service always belongs to the authenticated company.
        const companyId = req.company.id;

        // Task: does this company already have a service with the same title?
        const existing = await pool.query(
            'SELECT id FROM services WHERE company_id = $1 AND title = $2',
            [companyId, title]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({
                message: 'Service already exists',
            });
        }

        // Task: create the service.
        // COALESCE($8, TRUE) = "use the given value, or TRUE if none was sent".
        const { rows } = await pool.query(
            `INSERT INTO services (company_id, title, category, description, price, location, image, is_available)
             VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, TRUE))
             RETURNING id, company_id AS company, title, category, description, price, location, image,
                is_available AS "isAvailable", created_at AS "createdAt", updated_at AS "updatedAt"`,
            [
                companyId,
                title,
                category,
                description,
                Number(price),
                location ?? null,
                image ?? null,
                isAvailable ?? null,
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Service added successfully',
            service: rows[0],
        });
    } catch (err) {
        // 23505 = unique violation (same company + same title created twice at the same moment)
        if (err.code === '23505') {
            return res.status(409).json({ message: 'Service already exists' });
        }
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const postEditService = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, description, price, location, image, isAvailable } = req.body;

        // Task: find the service (we need to know which company owns it).
        const found = await pool.query('SELECT id, company_id FROM services WHERE id = $1', [id]);
        const existingService = found.rows[0];

        if (!existingService) {
            return res.status(404).json({
                message: 'Service not found',
            });
        }
        if (existingService.company_id !== req.company.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        if (price !== undefined && price !== null && price !== '' && !isValidPrice(price)) {
            return res.status(400).json({ message: 'Price must be a valid number' });
        }

        // Task: update only the fields that were sent.
        // COALESCE($2, title) = "use the new value, or keep the old one if none was sent (NULL)".
        const { rows } = await pool.query(
            `UPDATE services
                SET title        = COALESCE($2, title),
                    category     = COALESCE($3, category),
                    description  = COALESCE($4, description),
                    price        = COALESCE($5, price),
                    location     = COALESCE($6, location),
                    image        = COALESCE($7, image),
                    is_available = COALESCE($8, is_available)
              WHERE id = $1
          RETURNING id, company_id AS company, title, category, description, price, location, image,
                is_available AS "isAvailable", created_at AS "createdAt", updated_at AS "updatedAt"`,
            [
                id,
                title || null,
                category || null,
                description || null,
                price === undefined || price === null || price === '' ? null : Number(price),
                location || null,
                image || null,
                typeof isAvailable === 'boolean' ? isAvailable : null,
            ]
        );

        res.status(200).json({
            success: true,
            message: 'Service updated successfuly.',
            existingService: rows[0],
        });
    } catch (err) {
        // 23505 = unique violation (another service of this company already has that title)
        if (err.code === '23505') {
            return res.status(409).json({ message: 'Service already exists' });
        }
        // 22P02 = the id in the URL is not a valid UUID, so no such service exists
        if (err.code === '22P02') {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const postDeleteService = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, message } = req.body;

        // Task: find the service (also sent back in the response).
        const found = await pool.query(
            `SELECT id, company_id AS company, title, category, description, price, location, image,
                is_available AS "isAvailable", created_at AS "createdAt", updated_at AS "updatedAt"
               FROM services
              WHERE id = $1`,
            [id]
        );
        const existingService = found.rows[0];

        if (!existingService) {
            return res.status(404).json({
                message: 'Service not found',
            });
        }
        if (existingService.company !== req.company.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Cancel + notify + delete happen together: either everything is saved or nothing is.
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Task: cancel every in-progress request of this service and notify each consumer.
            // Step 1 (inside WITH): set those requests to 'cancelled' and remember them.
            // Step 2: insert one notification for every request that was just cancelled.
            await client.query(
                `WITH cancelled AS (
                     UPDATE requests
                        SET status = 'cancelled'
                      WHERE service_id = $1
                        AND status = 'inProgress'
                  RETURNING id, consumer_id, company_id
                 )
                 INSERT INTO notifications (consumer_id, company_id, recipient_type, request_id, title, message)
                 SELECT consumer_id, company_id, 'consumer', id, $2, $3
                   FROM cancelled`,
                [
                    id,
                    title || 'Service cancelled',
                    message || 'Your accepted service request has been cancelled because the service was removed.',
                ]
            );

            // Task: delete the service.
            // Old requests and reviews are kept: their service_id just becomes NULL (ON DELETE SET NULL).
            await client.query('DELETE FROM services WHERE id = $1', [id]);

            await client.query('COMMIT');
        } catch (txError) {
            await client.query('ROLLBACK');
            throw txError;
        } finally {
            client.release();
        }

        res.status(200).json({
            success: true,
            message: 'Service deleted successfuly.',
            existingService,
        });
    } catch (err) {
        // 22P02 = the id in the URL is not a valid UUID, so no such service exists
        if (err.code === '22P02') {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const getCompanyServices = async (req, res) => {
    try {
        // Task: all services of the logged-in company.
        const { rows } = await pool.query(
            `SELECT id, company_id AS company, title, category, description, price, location, image,
                is_available AS "isAvailable", created_at AS "createdAt", updated_at AS "updatedAt"
               FROM services
              WHERE company_id = $1
              ORDER BY created_at ASC`,
            [req.company.id]
        );
        res.json({
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

module.exports = {
    postAddService,
    postEditService,
    getCompanyServices,
    postDeleteService,
};
