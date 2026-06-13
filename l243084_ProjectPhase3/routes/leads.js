const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// GET all leads (Super Admin)
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT l.*, t.company_name,
               u.first_name + ' ' + u.last_name AS assigned_user
        FROM Leads l
        LEFT JOIN Tenants t ON l.tenant_id = t.tenant_id
        LEFT JOIN Users   u ON l.assigned_user_id = u.user_id
        ORDER BY l.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET leads by tenant (Tenant Admin)
router.get('/tenant/:tenant_id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('tenant_id', sql.Int, req.params.tenant_id)
      .query(`
        SELECT l.*,
               u.first_name + ' ' + u.last_name AS assigned_user
        FROM Leads l
        LEFT JOIN Users u ON l.assigned_user_id = u.user_id
        WHERE l.tenant_id = @tenant_id
        ORDER BY l.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET leads assigned to agent (Sales Agent)
router.get('/agent/:user_id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('user_id', sql.Int, req.params.user_id)
      .query(`
        SELECT l.*,
               u.first_name + ' ' + u.last_name AS assigned_user
        FROM Leads l
        LEFT JOIN Users u ON l.assigned_user_id = u.user_id
        WHERE l.assigned_user_id = @user_id
        ORDER BY l.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD new lead
router.post('/add', async (req, res) => {
  try {
    const { tenant_id, first_name, last_name, email, phone, company, source, status, notes, assigned_user_id } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('tenant_id',       sql.Int,     tenant_id || 1)
      .input('first_name',      sql.VarChar, first_name)
      .input('last_name',       sql.VarChar, last_name)
      .input('email',           sql.VarChar, email)
      .input('phone',           sql.VarChar, phone)
      .input('company',         sql.VarChar, company)
      .input('source',          sql.VarChar, source)
      .input('status',          sql.VarChar, status || 'new')
      .input('notes',           sql.VarChar, notes)
      .input('assigned_user_id',sql.Int,     assigned_user_id || null)
      .query(`
        INSERT INTO Leads
          (tenant_id, first_name, last_name, email, phone, company, source, status, notes, assigned_user_id)
        VALUES
          (@tenant_id, @first_name, @last_name, @email, @phone, @company, @source, @status, @notes, @assigned_user_id)
      `);
    res.json({ message: '✅ Lead added successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE lead (full update)
router.put('/update/:id', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, company, source, status, notes, assigned_user_id } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('first_name',      sql.VarChar, first_name)
      .input('last_name',       sql.VarChar, last_name)
      .input('email',           sql.VarChar, email)
      .input('phone',           sql.VarChar, phone)
      .input('company',         sql.VarChar, company)
      .input('source',          sql.VarChar, source)
      .input('status',          sql.VarChar, status)
      .input('notes',           sql.VarChar, notes)
      .input('assigned_user_id',sql.Int,     assigned_user_id || null)
      .input('lead_id',         sql.Int,     req.params.id)
      .query(`
        UPDATE Leads SET
          first_name       = @first_name,
          last_name        = @last_name,
          email            = @email,
          phone            = @phone,
          company          = @company,
          source           = @source,
          status           = @status,
          notes            = @notes,
          assigned_user_id = @assigned_user_id,
          last_updated     = GETDATE()
        WHERE lead_id = @lead_id
      `);
    res.json({ message: '✅ Lead updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE lead
router.delete('/delete/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('lead_id', sql.Int, req.params.id)
      .query('DELETE FROM Leads WHERE lead_id = @lead_id');
    res.json({ message: '✅ Lead deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
