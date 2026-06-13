const express = require('express');
const router  = express.Router();
const { sql, poolPromise } = require('../db');

// GET all lead conversions by tenant
router.get('/tenant/:tenant_id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('tenant_id', sql.Int, req.params.tenant_id)
      .query(`
        SELECT
          lc.*,
          l.first_name + ' ' + l.last_name AS lead_name,
          c.first_name + ' ' + c.last_name AS contact_name,
          a.account_name,
          o.opportunity_name,
          u.first_name + ' ' + u.last_name AS converted_by_user
        FROM Lead_Conversions lc
        LEFT JOIN Leads        l ON lc.lead_id        = l.lead_id
        LEFT JOIN Contacts     c ON lc.contact_id     = c.contact_id
        LEFT JOIN Accounts     a ON lc.account_id     = a.account_id
        LEFT JOIN Opportunities o ON lc.opportunity_id = o.opportunity_id
        LEFT JOIN Users        u ON lc.converted_by   = u.user_id
        WHERE lc.tenant_id = @tenant_id
        ORDER BY lc.converted_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET conversion details by lead
router.get('/lead/:lead_id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('lead_id', sql.Int, req.params.lead_id)
      .query(`
        SELECT
          lc.*,
          c.first_name + ' ' + c.last_name AS contact_name,
          a.account_name,
          o.opportunity_name
        FROM Lead_Conversions lc
        LEFT JOIN Contacts     c ON lc.contact_id     = c.contact_id
        LEFT JOIN Accounts     a ON lc.account_id     = a.account_id
        LEFT JOIN Opportunities o ON lc.opportunity_id = o.opportunity_id
        WHERE lc.lead_id = @lead_id
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CONVERT a lead (add conversion record)
router.post('/convert', async (req, res) => {
  try {
    const { tenant_id, lead_id, contact_id, account_id, opportunity_id, converted_by, notes } = req.body;
    const pool = await poolPromise;

    // Insert conversion record
    await pool.request()
      .input('tenant_id',      sql.Int,     tenant_id)
      .input('lead_id',        sql.Int,     lead_id)
      .input('contact_id',     sql.Int,     contact_id     || null)
      .input('account_id',     sql.Int,     account_id     || null)
      .input('opportunity_id', sql.Int,     opportunity_id || null)
      .input('converted_by',   sql.Int,     converted_by   || null)
      .input('notes',          sql.VarChar, notes          || null)
      .query(`
        INSERT INTO Lead_Conversions
          (tenant_id, lead_id, contact_id, account_id, opportunity_id, converted_by, notes)
        VALUES
          (@tenant_id, @lead_id, @contact_id, @account_id, @opportunity_id, @converted_by, @notes)
      `);

    // Update lead status to converted
    await pool.request()
      .input('lead_id', sql.Int, lead_id)
      .query(`UPDATE Leads SET status = 'converted', last_updated = GETDATE() WHERE lead_id = @lead_id`);

    res.json({ message: '✅ Lead converted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE conversion record
router.delete('/delete/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('conversion_id', sql.Int, req.params.id)
      .query('DELETE FROM Lead_Conversions WHERE conversion_id = @conversion_id');
    res.json({ message: '✅ Conversion record deleted!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;