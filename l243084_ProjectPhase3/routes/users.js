const express = require('express');
const router  = express.Router();
const { sql, poolPromise } = require('../db');

async function ensureUsersTable(pool) {
  await pool.request().query(`
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

    IF OBJECT_ID('dbo.Users', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Users (
        user_id INT IDENTITY(1,1) PRIMARY KEY,
        tenant_id INT NULL,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(50) NULL,
        role VARCHAR(50) NOT NULL,
        is_active BIT NOT NULL DEFAULT 1,
        last_login DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE()
      );
    END
  `);
}

// GET all users (Super Admin)
router.get('/', async (req, res) => {
  try {
    const pool   = await poolPromise;
    if (!pool) {
      throw new Error('Database connection is not available. Check SQL Server connection in db.js.');
    }

    await ensureUsersTable(pool);

    const result = await pool.request()
      .query(`
        SELECT
          u.user_id,
          u.username,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          u.role,
          u.is_active,
          u.last_login,
          u.created_at,
          t.company_name
        FROM Users u
        LEFT JOIN Tenants t ON u.tenant_id = t.tenant_id
        ORDER BY u.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET users by tenant (Tenant Admin)
router.get('/tenant/:tenant_id', async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('tenant_id', sql.Int, req.params.tenant_id)
      .query(`
        SELECT
          user_id,
          username,
          first_name,
          last_name,
          email,
          phone,
          role,
          is_active,
          last_login,
          created_at
        FROM Users
        WHERE tenant_id = @tenant_id
        ORDER BY created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD new user
router.post('/add', async (req, res) => {
  try {
    const {
      tenant_id,
      username,
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      role
    } = req.body;

    const pool = await poolPromise;
    if (!pool) {
      throw new Error('Database connection is not available. Check SQL Server connection in db.js.');
    }

    await ensureUsersTable(pool);

    await pool.request()
      .input('tenant_id',     sql.Int,     tenant_id)
      .input('username',      sql.VarChar, username)
      .input('email',         sql.VarChar, email)
      .input('password_hash', sql.VarChar, password_hash)
      .input('first_name',    sql.VarChar, first_name)
      .input('last_name',     sql.VarChar, last_name)
      .input('phone',         sql.VarChar, phone)
      .input('role',          sql.VarChar, role)
      .query(`
        INSERT INTO Users
          (tenant_id, username, email, password_hash,
           first_name, last_name, phone, role)
        VALUES
          (@tenant_id, @username, @email, @password_hash,
           @first_name, @last_name, @phone, @role)
      `);
    res.json({ message: '✅ User added successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE user role
router.put('/role/:id', async (req, res) => {
  try {
    const { role } = req.body;
    const pool     = await poolPromise;
    await pool.request()
      .input('role',    sql.VarChar, role)
      .input('user_id', sql.Int,     req.params.id)
      .query('UPDATE Users SET role = @role WHERE user_id = @user_id');
    res.json({ message: '✅ User role updated!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE user status (activate/deactivate)
router.put('/status/:id', async (req, res) => {
  try {
    const { is_active } = req.body;
    const pool          = await poolPromise;
    await pool.request()
      .input('is_active', sql.Bit, is_active)
      .input('user_id',   sql.Int, req.params.id)
      .query('UPDATE Users SET is_active = @is_active WHERE user_id = @user_id');
    res.json({ message: '✅ User status updated!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE user
router.delete('/delete/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('user_id', sql.Int, req.params.id)
      .query('DELETE FROM Users WHERE user_id = @user_id');
    res.json({ message: '✅ User deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
