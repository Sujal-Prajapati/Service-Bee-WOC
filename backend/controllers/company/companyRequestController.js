const { pool } = require('../../config/db');

const PAGE_SIZE = 50;
const FILTERABLE_STATUSES = ['pending', 'inProgress', 'resolved', 'rejected'];
const ALLOWED_STATUSES = ['pending', 'inProgress', 'rejected', 'resolved', 'cancelled'];

const getCompanyRequests = async (req, res) => {
    try {
        const { status, search, page } = req.query;
        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const offset = (pageNumber - 1) * PAGE_SIZE;

        // null means "no filter" (the SQL below ignores a filter whose value is NULL).
        const statusFilter = FILTERABLE_STATUSES.includes(status) ? status : null;

        // The search text is wrapped in % for ILIKE; \ % _ typed by the user are escaped so they match literally.
        const searchPattern =
            typeof search === 'string' && search.trim()
                ? `%${search.trim().replace(/[\\%_]/g, '\\$&')}%`
                : null;

        // Task: this company's requests, optionally filtered by status and search text,
        // newest first, one page at a time (LIMIT / OFFSET).
        const { rows: requests } = await pool.query(
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
              WHERE r.company_id = $1
                AND ($2::text IS NULL OR r.status = $2)
                AND ($3::text IS NULL
                     OR r.description ILIKE $3
                     OR r.address     ILIKE $3
                     OR u.name        ILIKE $3)
              ORDER BY r.created_at DESC
              LIMIT $4 OFFSET $5`,
            [req.company.id, statusFilter, searchPattern, PAGE_SIZE, offset]
        );

        // Task: how many requests match the same filters (for pagination).
        const countResult = await pool.query(
            `SELECT COUNT(*) AS total
               FROM requests r
               JOIN consumers u ON u.id = r.consumer_id
              WHERE r.company_id = $1
                AND ($2::text IS NULL OR r.status = $2)
                AND ($3::text IS NULL
                     OR r.description ILIKE $3
                     OR r.address     ILIKE $3
                     OR u.name        ILIKE $3)`,
            [req.company.id, statusFilter, searchPattern]
        );

        // Task: number of requests in each status for the whole company (ignores the filters).
        const statusResult = await pool.query(
            `SELECT status, COUNT(*) AS count
               FROM requests
              WHERE company_id = $1
              GROUP BY status`,
            [req.company.id]
        );

        const counts = {
            total: 0,
            pending: 0,
            inProgress: 0,
            resolved: 0,
            rejected: 0,
            cancelled: 0,
        };
        for (const row of statusResult.rows) {
            counts.total += row.count;
            counts[row.status] = row.count;
        }

        res.status(200).json({
            success: true,
            requests,
            total: countResult.rows[0].total,
            counts,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const getRequestDetail = async (req, res) => {
    try {
        const { compId } = req.params;

        // Task: one request with its service, company and consumer details.
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
            [compId]
        );
        const request = rows[0];

        if (!request) {
            return res.status(404).json({
                message: 'Request not found',
            });
        }
        if (request.company.id !== req.company.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Task: opening the request counts as reading its notification(s).
        await pool.query(
            `UPDATE notifications
                SET is_read = TRUE
              WHERE request_id = $1
                AND recipient_type = 'company'
                AND company_id = $2
                AND is_read = FALSE`,
            [compId, req.company.id]
        );

        res.status(200).json({
            request,
        });
    } catch (err) {
        // 22P02 = the compId in the URL is not a valid UUID, so no such request exists
        if (err.code === '22P02') {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.status(500).json({
            message: err.message,
        });
    }
};

const patchUpdateRequestStatus = async (req, res) => {
    try {
        const { compId } = req.params;
        const { status, technicianName, technicianPhone, technicianRole, companyExpectedDate, companyNote } = req.body;

        if (!ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status',
            });
        }

        // Task: find the request (we need its current status, its consumer and its company).
        const found = await pool.query(
            'SELECT id, status, consumer_id, company_id FROM requests WHERE id = $1',
            [compId]
        );
        const request = found.rows[0];

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found',
            });
        }

        if (req.company.id !== request.company_id) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden',
            });
        }

        if (status === request.status) {
            return res.status(409).json({
                message: 'Status is already set',
            });
        }

        const canTransition =
            (request.status === 'pending' && (status === 'rejected' || status === 'inProgress')) ||
            (request.status === 'inProgress' && (status === 'resolved' || status === 'cancelled'));

        if (!canTransition) {
            return res.status(409).json({
                success: false,
                message: 'Status cannot be updated to the state',
            });
        }

        // Technician details are only used when the company accepts the request (inProgress).
        // null = "leave the column as it is" (see COALESCE in the UPDATE below).
        let tech = { name: null, phone: null, role: null, expectedDate: null, note: null };
        if (status === 'inProgress') {
            const expectedDate = companyExpectedDate ? new Date(companyExpectedDate) : null;
            if (
                !expectedDate ||
                Number.isNaN(expectedDate.getTime()) ||
                expectedDate < new Date() ||
                !technicianName ||
                !technicianPhone ||
                !technicianRole
            ) {
                return res.status(400).json({
                    message: 'expected date is invalid',
                });
            }
            tech = {
                name: technicianName,
                phone: String(technicianPhone),
                role: technicianRole,
                expectedDate,
                note: companyNote || null,
            };
        }

        // The message the consumer will see in their notifications.
        const company = req.company.name || 'The company';
        const notificationMessages = {
            rejected: `${company} has rejected your request. Please open your request for details.`,
            inProgress: `${company} has accepted your request and assigned a technician. Please check your request for details.`,
            resolved: `${company} has marked your request as resolved. Please review the service.`,
            cancelled: `${company} has cancelled your request. Please open your request for details.`,
        };

        // Status change + consumer notification are saved together (BEGIN ... COMMIT).
        let updated;
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Task: change the status (and technician details when accepting).
            // "AND status = $2" makes sure nobody changed the status in the meantime;
            // if they did, no row is updated (rowCount = 0).
            updated = await client.query(
                `UPDATE requests
                    SET status                = $3,
                        technician_name       = COALESCE($4, technician_name),
                        technician_phone      = COALESCE($5, technician_phone),
                        technician_role       = COALESCE($6, technician_role),
                        company_expected_date = COALESCE($7, company_expected_date),
                        company_note          = COALESCE($8, company_note)
                  WHERE id = $1
                    AND status = $2`,
                [compId, request.status, status, tech.name, tech.phone, tech.role, tech.expectedDate, tech.note]
            );

            if (updated.rowCount === 1) {
                // Task: tell the consumer that their request changed.
                await client.query(
                    `INSERT INTO notifications (consumer_id, company_id, recipient_type, request_id, title, message)
                     VALUES ($1, $2, 'consumer', $3, 'Request update', $4)`,
                    [request.consumer_id, request.company_id, request.id, notificationMessages[status]]
                );
            }

            await client.query('COMMIT');
        } catch (txError) {
            await client.query('ROLLBACK');
            throw txError;
        } finally {
            client.release();
        }

        if (updated.rowCount === 0) {
            return res.status(409).json({
                success: false,
                message: 'This request was just updated elsewhere. Please refresh and try again.',
            });
        }

        // Task: read the updated request back (with service, company and consumer) for the response.
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
            [compId]
        );

        return res.status(200).json({
            success: true,
            message: 'Status updated successfully',
            request: rows[0],
        });
    } catch (err) {
        // 22P02 = the compId in the URL is not a valid UUID, so no such request exists
        if (err.code === '22P02') {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

module.exports = {
    getCompanyRequests,
    getRequestDetail,
    patchUpdateRequestStatus,
};
