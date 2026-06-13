const express = require('express');
const router  = express.Router();
const { sql, poolPromise } = require('../db');

// GET all notifications for a user
router.get('/user/:user_id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('user_id', sql.Int, req.params.user_id)
      .query(`
        SELECT n.*,
               u.first_name + ' ' + u.last_name AS user_name
        FROM Notifications n
        LEFT JOIN Users u ON n.user_id = u.user_id
        WHERE n.user_id = @user_id
        ORDER BY n.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all notifications by tenant (Tenant Admin)
router.get('/tenant/:tenant_id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('tenant_id', sql.Int, req.params.tenant_id)
      .query(`
        SELECT n.*,
               u.first_name + ' ' + u.last_name AS user_name
        FROM Notifications n
        LEFT JOIN Users u ON n.user_id = u.user_id
        WHERE n.tenant_id = @tenant_id
        ORDER BY n.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD new notification
router.post('/add', async (req, res) => {
  try {
    const { tenant_id, user_id, notification_type, title, message, related_type, related_id } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('tenant_id',         sql.Int,     tenant_id)
      .input('user_id',           sql.Int,     user_id)
      .input('notification_type', sql.VarChar, notification_type)
      .input('title',             sql.VarChar, title)
      .input('message',           sql.VarChar, message)
      .input('related_type',      sql.VarChar, related_type || null)
      .input('related_id',        sql.Int,     related_id   || null)
      .query(`
        INSERT INTO Notifications
          (tenant_id, user_id, notification_type, title, message, related_type, related_id)
        VALUES
          (@tenant_id, @user_id, @notification_type, @title, @message, @related_type, @related_id)
      `);
    res.json({ message: '✅ Notification added!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MARK notification as read
router.put('/read/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('notification_id', sql.Int, req.params.id)
      .query(`
        UPDATE Notifications
        SET is_read = 1, read_at = GETDATE()
        WHERE notification_id = @notification_id
      `);
    res.json({ message: '✅ Notification marked as read!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE notification
router.delete('/delete/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('notification_id', sql.Int, req.params.id)
      .query('DELETE FROM Notifications WHERE notification_id = @notification_id');
    res.json({ message: '✅ Notification deleted!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;