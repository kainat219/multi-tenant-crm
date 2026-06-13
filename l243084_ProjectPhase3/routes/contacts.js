const express = require('express');
const router  = express.Router();
const { sql, poolPromise } = require('../db');

// GET all contacts (Super Admin)
router.get('/', async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT
          c.contact_id,
          c.first_name,
          c.last_name,
          c.email,
          c.phone,
          c.job_title,
          c.is_active,
          c.created_at,
          t.company_name,
          a.account_name,
          u.first_name + ' ' + u.last_name AS assigned_user
        FROM Contacts c
        LEFT JOIN Tenants  t ON c.tenant_id       = t.tenant_id
        LEFT JOIN Accounts a ON c.account_id      = a.account_id
        LEFT JOIN Users    u ON c.assigned_user_id = u.user_id
        ORDER BY c.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET contacts by tenant (Tenant Admin)
router.get('/tenant/:tenant_id', async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('tenant_id', sql.Int, req.params.tenant_id)
      .query(`
        SELECT
          c.contact_id,
          c.first_name,
          c.last_name,
          c.email,
          c.phone,
          c.job_title,
          c.is_active,
          c.created_at,
          a.account_name,
          u.first_name + ' ' + u.last_name AS assigned_user
        FROM Contacts c
        LEFT JOIN Accounts a ON c.account_id       = a.account_id
        LEFT JOIN Users    u ON c.assigned_user_id  = u.user_id
        WHERE c.tenant_id = @tenant_id
        ORDER BY c.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET contacts by user (Sales Agent)
router.get('/user/:user_id', async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('user_id', sql.Int, req.params.user_id)
      .query(`
        SELECT
          c.contact_id,
          c.first_name,
          c.last_name,
          c.email,
          c.phone,
          c.job_title,
          c.is_active,
          c.created_at,
          a.account_name
        FROM Contacts c
        LEFT JOIN Accounts a ON c.account_id = a.account_id
        WHERE c.assigned_user_id = @user_id
        ORDER BY c.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD new contact
router.post('/add', async (req, res) => {
  try {
    const {
      tenant_id,
      first_name,
      last_name,
      email,
      phone,
      job_title,
      account_id,
      assigned_user_id
    } = req.body;

    const pool = await poolPromise;
    await pool.request()
      .input('tenant_id',       sql.Int,     tenant_id)
      .input('first_name',      sql.VarChar, first_name)
      .input('last_name',       sql.VarChar, last_name)
      .input('email',           sql.VarChar, email)
      .input('phone',           sql.VarChar, phone)
      .input('job_title',       sql.VarChar, job_title)
      .input('account_id',      sql.Int,     account_id      || null)
      .input('assigned_user_id',sql.Int,     assigned_user_id || null)
      .query(`
        INSERT INTO Contacts
          (tenant_id, first_name, last_name, email,
           phone, job_title, account_id, assigned_user_id)
        VALUES
          (@tenant_id, @first_name, @last_name, @email,
           @phone, @job_title, @account_id, @assigned_user_id)
      `);
    res.json({ message: '✅ Contact added successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE contact
router.put('/update/:id', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      job_title,
      account_id,
      assigned_user_id
    } = req.body;

    const pool = await poolPromise;
    await pool.request()
      .input('first_name',      sql.VarChar, first_name)
      .input('last_name',       sql.VarChar, last_name)
      .input('email',           sql.VarChar, email)
      .input('phone',           sql.VarChar, phone)
      .input('job_title',       sql.VarChar, job_title)
      .input('account_id',      sql.Int,     account_id       || null)
      .input('assigned_user_id',sql.Int,     assigned_user_id || null)
      .input('contact_id',      sql.Int,     req.params.id)
      .query(`
        UPDATE Contacts SET
          first_name       = @first_name,
          last_name        = @last_name,
          email            = @email,
          phone            = @phone,
          job_title        = @job_title,
          account_id       = @account_id,
          assigned_user_id = @assigned_user_id
        WHERE contact_id = @contact_id
      `);
    res.json({ message: '✅ Contact updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE contact
router.delete('/delete/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('contact_id', sql.Int, req.params.id)
      .query('DELETE FROM Contacts WHERE contact_id = @contact_id');
    res.json({ message: '✅ Contact deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;