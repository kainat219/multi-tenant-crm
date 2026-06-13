const express = require('express');
const router  = express.Router();
const { sql, poolPromise } = require('../db');

// GET all opportunities (Super Admin)
router.get('/', async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT
          o.opportunity_id,
          o.opportunity_name,
          o.deal_value,
          o.expected_close_date,
          o.status,
          o.created_at,
          o.last_updated,
          t.company_name,
          a.account_name,
          c.first_name + ' ' + c.last_name AS contact_name,
          u.first_name + ' ' + u.last_name AS assigned_user,
          ps.stage_name
        FROM Opportunities o
        LEFT JOIN Tenants        t  ON o.tenant_id       = t.tenant_id
        LEFT JOIN Accounts       a  ON o.account_id      = a.account_id
        LEFT JOIN Contacts       c  ON o.contact_id      = c.contact_id
        LEFT JOIN Users          u  ON o.assigned_user_id= u.user_id
        LEFT JOIN Pipeline_Stages ps ON o.stage_id       = ps.stage_id
        ORDER BY o.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET opportunities by tenant (Tenant Admin)
router.get('/tenant/:tenant_id', async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('tenant_id', sql.Int, req.params.tenant_id)
      .query(`
        SELECT
          o.opportunity_id,
          o.opportunity_name,
          o.deal_value,
          o.expected_close_date,
          o.status,
          o.created_at,
          o.last_updated,
          a.account_name,
          c.first_name + ' ' + c.last_name AS contact_name,
          u.first_name + ' ' + u.last_name AS assigned_user,
          ps.stage_name
        FROM Opportunities o
        LEFT JOIN Accounts        a  ON o.account_id      = a.account_id
        LEFT JOIN Contacts        c  ON o.contact_id      = c.contact_id
        LEFT JOIN Users           u  ON o.assigned_user_id= u.user_id
        LEFT JOIN Pipeline_Stages ps ON o.stage_id        = ps.stage_id
        WHERE o.tenant_id = @tenant_id
        ORDER BY o.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET opportunities by user (Sales Agent)
router.get('/user/:user_id', async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('user_id', sql.Int, req.params.user_id)
      .query(`
        SELECT
          o.opportunity_id,
          o.opportunity_name,
          o.deal_value,
          o.expected_close_date,
          o.status,
          o.created_at,
          o.last_updated,
          a.account_name,
          c.first_name + ' ' + c.last_name AS contact_name,
          ps.stage_name
        FROM Opportunities o
        LEFT JOIN Accounts        a  ON o.account_id = a.account_id
        LEFT JOIN Contacts        c  ON o.contact_id = c.contact_id
        LEFT JOIN Pipeline_Stages ps ON o.stage_id   = ps.stage_id
        WHERE o.assigned_user_id = @user_id
        ORDER BY o.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD new opportunity
router.post('/add', async (req, res) => {
  try {
    const {
      tenant_id,
      opportunity_name,
      account_id,
      contact_id,
      stage_id,
      assigned_user_id,
      deal_value,
      expected_close_date,
      status,
      notes
    } = req.body;

    const pool = await poolPromise;
    await pool.request()
      .input('tenant_id',          sql.Int,     tenant_id)
      .input('opportunity_name',   sql.VarChar, opportunity_name)
      .input('account_id',         sql.Int,     account_id)
      .input('contact_id',         sql.Int,     contact_id)
      .input('stage_id',           sql.Int,     stage_id)
      .input('assigned_user_id',   sql.Int,     assigned_user_id)
      .input('deal_value',         sql.Decimal, deal_value)
      .input('expected_close_date',sql.Date,    expected_close_date)
      .input('status',             sql.VarChar, status)
      .input('notes',              sql.VarChar, notes)
      .query(`
        INSERT INTO Opportunities
          (tenant_id, opportunity_name, account_id, contact_id,
           stage_id, assigned_user_id, deal_value,
           expected_close_date, status, notes)
        VALUES
          (@tenant_id, @opportunity_name, @account_id, @contact_id,
           @stage_id, @assigned_user_id, @deal_value,
           @expected_close_date, @status, @notes)
      `);
    res.json({ message: '✅ Opportunity added successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE opportunity status
router.put('/status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const pool       = await poolPromise;
    await pool.request()
      .input('status',         sql.VarChar, status)
      .input('opportunity_id', sql.Int,     req.params.id)
      .query(`
        UPDATE Opportunities
        SET
          status       = @status,
          last_updated = GETDATE()
        WHERE opportunity_id = @opportunity_id
      `);
    res.json({ message: '✅ Opportunity status updated!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE opportunity stage
router.put('/stage/:id', async (req, res) => {
  try {
    const { stage_id } = req.body;
    const pool         = await poolPromise;
    await pool.request()
      .input('stage_id',       sql.Int, stage_id)
      .input('opportunity_id', sql.Int, req.params.id)
      .query(`
        UPDATE Opportunities
        SET
          stage_id     = @stage_id,
          last_updated = GETDATE()
        WHERE opportunity_id = @opportunity_id
      `);
    res.json({ message: '✅ Opportunity stage updated!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE opportunity
router.delete('/delete/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('opportunity_id', sql.Int, req.params.id)
      .query('DELETE FROM Opportunities WHERE opportunity_id = @opportunity_id');
    res.json({ message: '✅ Opportunity deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;