const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// GET total revenue per tenant
router.get('/revenue', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT t.company_name,
               SUM(b.amount)       AS total_revenue,
               COUNT(b.billing_id) AS total_invoices
        FROM   Billing_Records b
        JOIN   Tenants t ON b.tenant_id = t.tenant_id
        WHERE  b.payment_status = 'paid'
        GROUP  BY t.company_name
        ORDER  BY total_revenue DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET sales pipeline value per tenant
router.get('/pipeline', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT t.company_name,
               COUNT(o.opportunity_id) AS total_deals,
               SUM(o.deal_value)       AS pipeline_value,
               AVG(o.deal_value)       AS avg_deal_value
        FROM   Opportunities o
        JOIN   Tenants t ON o.tenant_id = t.tenant_id
        WHERE  o.status = 'open'
        GROUP  BY t.company_name
        ORDER  BY pipeline_value DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET total counts for dashboard cards
router.get('/counts', async (req, res) => {
  try {
    const pool = await poolPromise;

    const leads = await pool.request()
      .query('SELECT COUNT(*) AS total FROM Leads WHERE tenant_id = 1');

    const contacts = await pool.request()
      .query('SELECT COUNT(*) AS total FROM Contacts WHERE tenant_id = 1');

    const tickets = await pool.request()
      .query('SELECT COUNT(*) AS total FROM Support_Tickets WHERE tenant_id = 1');

    const tenants = await pool.request()
      .query('SELECT COUNT(*) AS total FROM Tenants');

    res.json({
      leads:    leads.recordset[0].total,
      contacts: contacts.recordset[0].total,
      tickets:  tickets.recordset[0].total,
      tenants:  tenants.recordset[0].total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;