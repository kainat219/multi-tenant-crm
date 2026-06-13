const express = require('express');
const router  = express.Router();
const { sql, poolPromise } = require('../db');

// GET all audit logs (Super Admin)
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT al.*,
               t.company_name,
               u.first_name + ' ' + u.last_name AS user_name,
               u.username
        FROM Audit_Logs al
        LEFT JOIN Tenants t ON al.tenant_id = t.tenant_id
        LEFT JOIN Users   u ON al.user_id   = u.user_id
        ORDER BY al.performed_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET audit logs by tenant
router.get('/tenant/:tenant_id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('tenant_id', sql.Int, req.params.tenant_id)
      .query(`
        SELECT al.*,
               u.first_name + ' ' + u.last_name AS user_name,
               u.username
        FROM Audit_Logs al
        LEFT JOIN Users u ON al.user_id = u.user_id
        WHERE al.tenant_id = @tenant_id
        ORDER BY al.performed_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
