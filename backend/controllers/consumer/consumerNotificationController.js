const { pool } = require('../../config/db');

const getNotifications = async (req, res) => {
    try {
        // Task: all notifications of this consumer, newest first.
        const { rows } = await pool.query(
            `SELECT id, consumer_id AS consumer, company_id AS company, recipient_type AS "recipientType",
                    request_id AS request, title, message, is_read AS "isRead",
                    created_at AS "createdAt", updated_at AS "updatedAt"
               FROM notifications
              WHERE consumer_id = $1
                AND recipient_type = 'consumer'
              ORDER BY created_at DESC`,
            [req.consumer.id]
        );
        res.status(200).json({
            notifications: rows,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const getUnreadNotifications = async (req, res) => {
    try {
        // Task: only the notifications this consumer has not read yet.
        const { rows } = await pool.query(
            `SELECT id, consumer_id AS consumer, company_id AS company, recipient_type AS "recipientType",
                    request_id AS request, title, message, is_read AS "isRead",
                    created_at AS "createdAt", updated_at AS "updatedAt"
               FROM notifications
              WHERE consumer_id = $1
                AND recipient_type = 'consumer'
                AND is_read = FALSE
              ORDER BY created_at DESC`,
            [req.consumer.id]
        );
        res.status(200).json({
            notifications: rows,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const patchMarkNotificationRead = async (req, res) => {
    try {
        const { notId } = req.params;

        // Task: mark ONE notification as read (only if it belongs to this consumer).
        const result = await pool.query(
            `UPDATE notifications
                SET is_read = TRUE
              WHERE id = $1
                AND recipient_type = 'consumer'
                AND consumer_id = $2`,
            [notId, req.consumer.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Notification not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
        });
    } catch (err) {
        // 22P02 = the id in the URL is not a valid UUID, so no such notification exists
        if (err.code === '22P02') {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const patchMarkAllNotificationRead = async (req, res) => {
    try {
        // Task: mark ALL unread notifications of this consumer as read.
        const result = await pool.query(
            `UPDATE notifications
                SET is_read = TRUE
              WHERE recipient_type = 'consumer'
                AND consumer_id = $1
                AND is_read = FALSE`,
            [req.consumer.id]
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
            updated: result.rowCount,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

module.exports = {
    getNotifications,
    getUnreadNotifications,
    patchMarkNotificationRead,
    patchMarkAllNotificationRead,
};
