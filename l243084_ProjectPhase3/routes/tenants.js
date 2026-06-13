const express = require('express');
const router  = express.Router();
const { sql, poolPromise } = require('../db');

async function ensureTenantsTable(pool) {
  await pool.request().query(`
    IF OBJECT_ID('dbo.Subscription_Plans', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Subscription_Plans (
        plan_id INT IDENTITY(1,1) PRIMARY KEY,
        plan_name VARCHAR(100) NOT NULL,
        max_users INT NULL,
        max_contacts INT NULL,
        price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
        features VARCHAR(MAX) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT GETDATE()
      );
    END

    IF OBJECT_ID('dbo.Tenants', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Tenants (
        tenant_id INT IDENTITY(1,1) PRIMARY KEY,
        company_name VARCHAR(150) NOT NULL,
        domain VARCHAR(150) NULL,
        contact_email VARCHAR(150) NOT NULL,
        phone VARCHAR(50) NULL,
        address VARCHAR(255) NULL,
        country VARCHAR(100) NULL,
        subscription_plan_id INT NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT GETDATE()
      );
    END
  `);
}

// GET all tenants
router.get('/', async (req, res) => {
  try {
    const pool   = await poolPromise;
    if (!pool) {
      throw new Error('Database connection is not available. Check SQL Server connection in db.js.');
    }

    await ensureTenantsTable(pool);

    const result = await pool.request()
      .query(`
        SELECT t.*, s.plan_name
        FROM Tenants t
        LEFT JOIN Subscription_Plans s ON t.subscription_plan_id = s.plan_id
        ORDER BY t.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD new tenant — returns tenant_id
router.post('/add', async (req, res) => {
  try {
    const { company_name, domain, contact_email, phone, address, country, subscription_plan_id } = req.body;
    const pool   = await poolPromise;
    if (!pool) {
      throw new Error('Database connection is not available. Check SQL Server connection in db.js.');
    }

    await ensureTenantsTable(pool);

    const result = await pool.request()
      .input('company_name',         sql.VarChar, company_name)
      .input('domain',               sql.VarChar, domain)
      .input('contact_email',        sql.VarChar, contact_email)
      .input('phone',                sql.VarChar, phone        || null)
      .input('address',              sql.VarChar, address      || null)
      .input('country',              sql.VarChar, country      || null)
      .input('subscription_plan_id', sql.Int,     subscription_plan_id || null)
      .query(`
        INSERT INTO Tenants (company_name, domain, contact_email, phone, address, country, subscription_plan_id)
        VALUES (@company_name, @domain, @contact_email, @phone, @address, @country, @subscription_plan_id);
        SELECT SCOPE_IDENTITY() AS tenant_id
      `);
    const tenant_id = result.recordset[0].tenant_id;
    res.json({ message: '✅ Tenant added successfully!', tenant_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE tenant details
router.put('/update/:id', async (req, res) => {
  try {
    const { company_name, contact_email, phone, country, subscription_plan_id } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('company_name',         sql.VarChar, company_name)
      .input('contact_email',        sql.VarChar, contact_email)
      .input('phone',                sql.VarChar, phone        || null)
      .input('country',              sql.VarChar, country      || null)
      .input('subscription_plan_id', sql.Int,     subscription_plan_id || null)
      .input('tenant_id',            sql.Int,     req.params.id)
      .query(`
        UPDATE Tenants SET
          company_name         = @company_name,
          contact_email        = @contact_email,
          phone                = @phone,
          country              = @country,
          subscription_plan_id = @subscription_plan_id
        WHERE tenant_id = @tenant_id
      `);
    res.json({ message: '✅ Tenant updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ACTIVATE / DEACTIVATE tenant
router.put('/status/:id', async (req, res) => {
  try {
    const { is_active } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('is_active', sql.Bit, is_active)
      .input('tenant_id', sql.Int, req.params.id)
      .query('UPDATE Tenants SET is_active = @is_active WHERE tenant_id = @tenant_id');
    res.json({ message: '✅ Tenant status updated!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE tenant
router.delete('/delete/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('tenant_id', sql.Int, req.params.id)
      .query('DELETE FROM Tenants WHERE tenant_id = @tenant_id');
    res.json({ message: '✅ Tenant deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
