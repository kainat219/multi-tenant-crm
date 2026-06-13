const express = require('express');
const router  = express.Router();
const { sql, poolPromise } = require('../db');

// GET all email integrations by tenant
router.get('/tenant/:tenant_id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('tenant_id', sql.Int, req.params.tenant_id)
      .query(`
        SELECT ei.*,
               u.first_name + ' ' + u.last_name AS user_name
        FROM Email_Integrations ei
        LEFT JOIN Users u ON ei.user_id = u.user_id
        WHERE ei.tenant_id = @tenant_id
        ORDER BY ei.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET email integrations by user
router.get('/user/:user_id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('user_id', sql.Int, req.params.user_id)
      .query(`
        SELECT * FROM Email_Integrations
        WHERE user_id = @user_id
        ORDER BY created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD new email integration
router.post('/add', async (req, res) => {
  try {
    const { tenant_id, user_id, email_provider, email_address, access_token, refresh_token, token_expires } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('tenant_id',      sql.Int,      tenant_id)
      .input('user_id',        sql.Int,      user_id)
      .input('email_provider', sql.VarChar,  email_provider)
      .input('email_address',  sql.VarChar,  email_address)
      .input('access_token',   sql.VarChar,  access_token  || null)
      .input('refresh_token',  sql.VarChar,  refresh_token || null)
      .input('token_expires',  sql.DateTime, token_expires || null)
      .query(`
        INSERT INTO Email_Integrations
          (tenant_id, user_id, email_provider, email_address, access_token, refresh_token, token_expires)
        VALUES
          (@tenant_id, @user_id, @email_provider, @email_address, @access_token, @refresh_token, @token_expires)
      `);
    res.json({ message: '✅ Email integration added!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE email integration (activate/deactivate)
router.put('/update/:id', async (req, res) => {
  try {
    const { is_active } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('is_active',       sql.Bit,      is_active ? 1 : 0)
      .input('last_synced',     sql.DateTime, new Date())
      .input('integration_id',  sql.Int,      req.params.id)
      .query(`
        UPDATE Email_Integrations
        SET is_active = @is_active, last_synced = @last_synced
        WHERE integration_id = @integration_id
      `);
    res.json({ message: '✅ Email integration updated!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE email integration
router.delete('/delete/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('integration_id', sql.Int, req.params.id)
      .query('DELETE FROM Email_Integrations WHERE integration_id = @integration_id');
    res.json({ message: '✅ Email integration deleted!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;