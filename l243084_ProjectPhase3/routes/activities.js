const express = require('express');
const router  = express.Router();
const { sql, poolPromise } = require('../db');

// GET all activities (Super Admin)
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT a.*, t.company_name,
               u.first_name + ' ' + u.last_name AS user_name
        FROM Activities a
        LEFT JOIN Tenants t ON a.tenant_id = t.tenant_id
        LEFT JOIN Users   u ON a.user_id   = u.user_id
        ORDER BY a.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET activities by tenant (Tenant Admin)
router.get('/tenant/:tenant_id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('tenant_id', sql.Int, req.params.tenant_id)
      .query(`
        SELECT a.*,
               u.first_name + ' ' + u.last_name AS user_name
        FROM Activities a
        LEFT JOIN Users u ON a.user_id = u.user_id
        WHERE a.tenant_id = @tenant_id
        ORDER BY a.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET activities by user (Sales Agent)
router.get('/user/:user_id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('user_id', sql.Int, req.params.user_id)
      .query(`
        SELECT a.*,
               u.first_name + ' ' + u.last_name AS user_name
        FROM Activities a
        LEFT JOIN Users u ON a.user_id = u.user_id
        WHERE a.user_id = @user_id
        ORDER BY a.due_date ASC, a.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD new activity
router.post('/add', async (req, res) => {
  try {
    const {
      tenant_id, user_id, activity_type, related_to,
      related_id, subject, description, due_date, is_completed
    } = req.body;

    const pool = await poolPromise;
    await pool.request()
      .input('tenant_id',     sql.Int,      tenant_id)
      .input('user_id',       sql.Int,      user_id)
      .input('activity_type', sql.VarChar,  activity_type)
      .input('related_to',    sql.VarChar,  related_to)
      .input('related_id',    sql.Int,      related_id)
      .input('subject',       sql.VarChar,  subject)
      .input('description',   sql.VarChar,  description)
      .input('due_date',      sql.DateTime, due_date || null)
      .input('is_completed',  sql.Bit,      is_completed ? 1 : 0)
      .query(`
        INSERT INTO Activities
          (tenant_id, user_id, activity_type, related_to, related_id,
           subject, description, due_date, is_completed)
        VALUES
          (@tenant_id, @user_id, @activity_type, @related_to, @related_id,
           @subject, @description, @due_date, @is_completed)
      `);
    res.json({ message: '✅ Activity logged successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE activity
router.put('/update/:id', async (req, res) => {
  try {
    const { subject, description, due_date, is_completed, activity_type } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('subject',       sql.VarChar,  subject)
      .input('description',   sql.VarChar,  description)
      .input('due_date',      sql.DateTime, due_date || null)
      .input('is_completed',  sql.Bit,      is_completed ? 1 : 0)
      .input('activity_type', sql.VarChar,  activity_type)
      .input('activity_id',   sql.Int,      req.params.id)
      .query(`
        UPDATE Activities SET
          subject       = @subject,
          description   = @description,
          due_date      = @due_date,
          is_completed  = @is_completed,
          activity_type = @activity_type
        WHERE activity_id = @activity_id
      `);
    res.json({ message: '✅ Activity updated!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark activity complete
router.put('/complete/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('activity_id', sql.Int, req.params.id)
      .query('UPDATE Activities SET is_completed = 1 WHERE activity_id = @activity_id');
    res.json({ message: '✅ Activity marked complete!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE activity
router.delete('/delete/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('activity_id', sql.Int, req.params.id)
      .query('DELETE FROM Activities WHERE activity_id = @activity_id');
    res.json({ message: '✅ Activity deleted!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
