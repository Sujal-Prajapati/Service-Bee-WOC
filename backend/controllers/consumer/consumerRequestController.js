const { pool } = require('../../config/db');

const getAllRequests = async (req, res) => {
    try {
        // Task: all requests made by this consumer (newest first),
        // each with its service, company and consumer details.
        const { rows } = await pool.query(
            `SELECT r.id,
                   r.status,
                   r.description,
                   r.expected_date         AS "expectedDate",
                   r.address,
                   r.pincode,
                   r.technician_name       AS "technicianName",
                   r.technician_phone      AS "technicianPhone",
                   r.technician_role       AS "technicianRole",
                   r.company_expected_date AS "companyExpectedDate",
                   r.consumer_note         AS "consumerNote",
                   r.company_note          AS "companyNote",
                   r.created_at            AS "createdAt",
                   r.updated_at            AS "updatedAt",
                   -- the service is NULL if the company deleted it after the request was made
                   CASE WHEN s.id IS NULL THEN NULL
                        ELSE json_build_object('id', s.id, 'title', s.title, 'category', s.category,
                                               'description', s.description, 'price', s.price,
                                               'location', s.location, 'image', s.image,
                                               'isAvailable', s.is_available)
                   END AS service,
                   json_build_object('id', c.id, 'name', c.name, 'email', c.email,
                                     'phone', c.phone, 'address', c.address) AS company,
                   json_build_object('id', u.id, 'name', u.name, 'email', u.email,
                                     'phone', u.phone, 'address', u.address) AS consumer
              FROM requests r
              LEFT JOIN services  s ON s.id = r.service_id
              JOIN      companies c ON c.id = r.company_id
              JOIN      consumers u ON u.id = r.consumer_id
              WHERE r.consumer_id = $1
              ORDER BY r.created_at DESC`,
            [req.consumer.id]
        );

        res.status(200).json({
            success: true,
            requests: rows,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const postAddRequest = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { description, expectedDate, address, pincode } = req.body;

        if (!address || !pincode || !expectedDate) {
            return res.status(400).json({
                message: 'Address, pincode and expected date are required.',
            });
        }

        const pincodeNumber = Number(pincode);
        if (!Number.isInteger(pincodeNumber) || pincodeNumber <= 0) {
            return res.status(400).json({ message: 'Pincode must be a valid number.' });
        }

        const expected = new Date(expectedDate);
        if (Number.isNaN(expected.getTime())) {
            return res.status(400).json({ message: 'Expected date is invalid.' });
        }

        // Task: find the service the consumer wants (we need to know which company owns it).
        const serviceResult = await pool.query(
            'SELECT id, company_id FROM services WHERE id = $1',
            [serviceId]
        );
        const service = serviceResult.rows[0];

        if (!service) {
            return res.status(404).json({
                message: 'Service not found',
            });
        }

        // Task: has this consumer already sent the exact same pending request?
        const duplicate = await pool.query(
            `SELECT 1
               FROM requests
              WHERE consumer_id   = $1
                AND service_id    = $2
                AND status        = 'pending'
                AND address       = $3
                AND pincode       = $4
                AND expected_date = $5
              LIMIT 1`,
            [req.consumer.id, service.id, address, pincodeNumber, expected]
        );

        if (duplicate.rows.length > 0) {
            return res.status(400).json({
                message: 'Request already exists',
            });
        }

        // The request and the company's notification are saved together:
        // if the second INSERT fails, the first one is undone (ROLLBACK).
        let requestId;
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Task: save the new request.
            const inserted = await client.query(
                `INSERT INTO requests (consumer_id, company_id, service_id, description, expected_date, address, pincode)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id`,
                [
                    req.consumer.id,
                    service.company_id,
                    service.id,
                    typeof description === 'string' ? description : null,
                    expected,
                    address,
                    pincodeNumber,
                ]
            );
            requestId = inserted.rows[0].id;

            // Task: tell the company that a new request arrived.
            await client.query(
                `INSERT INTO notifications (consumer_id, company_id, recipient_type, request_id, title, message)
                 VALUES ($1, $2, 'company', $3, 'New Service Request', $4)`,
                [
                    req.consumer.id,
                    service.company_id,
                    requestId,
                    `You have received a new request from ${req.consumer.name || 'a consumer'}`,
                ]
            );

            await client.query('COMMIT');
        } catch (txError) {
            await client.query('ROLLBACK');
            throw txError;
        } finally {
            client.release();
        }

        // Task: read the saved request back (with service, company and consumer) for the response.
        const { rows } = await pool.query(
            `SELECT r.id,
                   r.status,
                   r.description,
                   r.expected_date         AS "expectedDate",
                   r.address,
                   r.pincode,
                   r.technician_name       AS "technicianName",
                   r.technician_phone      AS "technicianPhone",
                   r.technician_role       AS "technicianRole",
                   r.company_expected_date AS "companyExpectedDate",
                   r.consumer_note         AS "consumerNote",
                   r.company_note          AS "companyNote",
                   r.created_at            AS "createdAt",
                   r.updated_at            AS "updatedAt",
                   -- the service is NULL if the company deleted it after the request was made
                   CASE WHEN s.id IS NULL THEN NULL
                        ELSE json_build_object('id', s.id, 'title', s.title, 'category', s.category,
                                               'description', s.description, 'price', s.price,
                                               'location', s.location, 'image', s.image,
                                               'isAvailable', s.is_available)
                   END AS service,
                   json_build_object('id', c.id, 'name', c.name, 'email', c.email,
                                     'phone', c.phone, 'address', c.address) AS company,
                   json_build_object('id', u.id, 'name', u.name, 'email', u.email,
                                     'phone', u.phone, 'address', u.address) AS consumer
              FROM requests r
              LEFT JOIN services  s ON s.id = r.service_id
              JOIN      companies c ON c.id = r.company_id
              JOIN      consumers u ON u.id = r.consumer_id
              WHERE r.id = $1`,
            [requestId]
        );

        res.status(201).json({
            success: true,
            message: 'Request registered successfully',
            request: rows[0],
        });
    } catch (err) {
        // 22P02 = the serviceId in the URL is not a valid UUID, so no such service exists
        if (err.code === '22P02') {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const deleteConsumerRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        // Task: find the request (we only need its owner and status).
        const found = await pool.query(
            'SELECT id, consumer_id, status FROM requests WHERE id = $1',
            [requestId]
        );
        const request = found.rows[0];

        if (!request) {
            return res.status(404).json({
                message: 'Request not found',
            });
        }

        if (request.consumer_id !== req.consumer.id) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden',
            });
        }

        if (request.status === 'inProgress') {
            return res.status(409).json({
                message: 'request cannot be deleted after being accepted',
            });
        }

        // Task: delete the request (its notifications are removed automatically by ON DELETE CASCADE).
        await pool.query(
            'DELETE FROM requests WHERE id = $1 AND consumer_id = $2',
            [requestId, req.consumer.id]
        );

        res.status(200).json({
            success: true,
            message: 'Request deleted successfully',
        });
    } catch (err) {
        // 22P02 = the requestId in the URL is not a valid UUID, so no such request exists
        if (err.code === '22P02') {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const getConsumerRequestDetail = async (req, res) => {
    try {
        const { requestId } = req.params;

        // Task: one request of this consumer, with service, company and consumer details.
        // "AND r.consumer_id = $2" means someone else's request is simply "not found".
        const { rows } = await pool.query(
            `SELECT r.id,
                   r.status,
                   r.description,
                   r.expected_date         AS "expectedDate",
                   r.address,
                   r.pincode,
                   r.technician_name       AS "technicianName",
                   r.technician_phone      AS "technicianPhone",
                   r.technician_role       AS "technicianRole",
                   r.company_expected_date AS "companyExpectedDate",
                   r.consumer_note         AS "consumerNote",
                   r.company_note          AS "companyNote",
                   r.created_at            AS "createdAt",
                   r.updated_at            AS "updatedAt",
                   -- the service is NULL if the company deleted it after the request was made
                   CASE WHEN s.id IS NULL THEN NULL
                        ELSE json_build_object('id', s.id, 'title', s.title, 'category', s.category,
                                               'description', s.description, 'price', s.price,
                                               'location', s.location, 'image', s.image,
                                               'isAvailable', s.is_available)
                   END AS service,
                   json_build_object('id', c.id, 'name', c.name, 'email', c.email,
                                     'phone', c.phone, 'address', c.address) AS company,
                   json_build_object('id', u.id, 'name', u.name, 'email', u.email,
                                     'phone', u.phone, 'address', u.address) AS consumer
              FROM requests r
              LEFT JOIN services  s ON s.id = r.service_id
              JOIN      companies c ON c.id = r.company_id
              JOIN      consumers u ON u.id = r.consumer_id
              WHERE r.id = $1
                AND r.consumer_id = $2`,
            [requestId, req.consumer.id]
        );
        const request = rows[0];

        if (!request) {
            return res.status(404).json({
                message: 'Request not found',
            });
        }

        // Task: opening the request counts as reading its notifications.
        await pool.query(
            `UPDATE notifications
                SET is_read = TRUE
              WHERE request_id = $1
                AND recipient_type = 'consumer'
                AND consumer_id = $2
                AND is_read = FALSE`,
            [requestId, req.consumer.id]
        );

        res.status(200).json({
            success: true,
            request,
        });
    } catch (err) {
        // 22P02 = the requestId in the URL is not a valid UUID, so no such request exists
        if (err.code === '22P02') {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

module.exports = {
    postAddRequest,
    getAllRequests,
    deleteConsumerRequest,
    getConsumerRequestDetail,
};
