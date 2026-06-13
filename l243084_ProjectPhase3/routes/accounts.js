const express = require('express');
const router  = express.Router();
const { sql, poolPromise } = require('../db');

// GET all accounts (Super Admin)
router.get('/', async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT
          a.account_id,
          a.account_name,
          a.industry,
          a.website,
          a.phone,
          a.country,
          a.annual_revenue,
          a.created_at,
          a.last_updated,
          t.company_name,
          u.first_name + ' ' + u.last_name AS assigned_user
        FROM Accounts a
        LEFT JOIN Tenants t ON a.tenant_id  = t.tenant_id
        LEFT JOIN Users   u ON a.assigned_user_id = u.user_id
        ORDER BY a.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET accounts by tenant (Tenant Admin)
router.get('/tenant/:tenant_id', async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('tenant_id', sql.Int, req.params.tenant_id)
      .query(`
        SELECT
          a.account_id,
          a.account_name,
          a.industry,
          a.website,
          a.phone,
          a.country,
          a.annual_revenue,
          a.created_at,
          a.last_updated,
          u.first_name + ' ' + u.last_name AS assigned_user
        FROM Accounts a
        LEFT JOIN Users u ON a.assigned_user_id = u.user_id
        WHERE a.tenant_id = @tenant_id
        ORDER BY a.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD new account
router.post('/add', async (req, res) => {
  try {
    const {
      tenant_id,
      account_name,
      industry,
      website,
      phone,
      country,
      annual_revenue,
      assigned_user_id
    } = req.body;

    const pool = await poolPromise;
    await pool.request()
      .input('tenant_id',       sql.Int,     tenant_id)
      .input('account_name',    sql.VarChar, account_name)
      .input('industry',        sql.VarChar, industry)
      .input('website',         sql.VarChar, website)
      .input('phone',           sql.VarChar, phone)
      .input('country',         sql.VarChar, country)
      .input('annual_revenue',  sql.Decimal, annual_revenue)
      .input('assigned_user_id',sql.Int,     assigned_user_id)
      .query(`
        INSERT INTO Accounts
          (tenant_id, account_name, industry, website,
           phone, country, annual_revenue, assigned_user_id)
        VALUES
          (@tenant_id, @account_name, @industry, @website,
           @phone, @country, @annual_revenue, @assigned_user_id)
      `);
    res.json({ message: '✅ Account added successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE account revenue
router.put('/update/:id', async (req, res) => {
  try {
    const { account_name, industry, annual_revenue } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('account_name',   sql.VarChar, account_name)
      .input('industry',       sql.VarChar, industry)
      .input('annual_revenue', sql.Decimal, annual_revenue)
      .input('account_id',     sql.Int,     req.params.id)
      .query(`
        UPDATE Accounts
        SET
          account_name   = @account_name,
          industry       = @industry,
          annual_revenue = @annual_revenue,
          last_updated   = GETDATE()
        WHERE account_id = @account_id
      `);
    res.json({ message: '✅ Account updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE account
router.delete('/delete/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('account_id', sql.Int, req.params.id)
      .query('DELETE FROM Accounts WHERE account_id = @account_id');
    res.json({ message: '✅ Account deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;