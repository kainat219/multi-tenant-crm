const express = require('express');
const router  = express.Router();
const { sql, poolPromise } = require('../db');

// POST → Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both username and password.'
      });
    }

    // Check user in database
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('username',      sql.VarChar, username)
      .input('password_hash', sql.VarChar, password)
      .query(`
        SELECT
          u.user_id,
          u.username,
          u.first_name,
          u.last_name,
          u.email,
          u.role,
          u.tenant_id,
          u.is_active,
          t.company_name
        FROM Users u
        LEFT JOIN Tenants t ON u.tenant_id = t.tenant_id
        WHERE u.username      = @username
        AND   u.password_hash = @password_hash
      `);

    // User not found
    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    const user = result.recordset[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Your account is deactivated. Contact admin.'
      });
    }

    // Update last login
    await pool.request()
      .input('user_id', sql.Int, user.user_id)
      .query('UPDATE Users SET last_login = GETDATE() WHERE user_id = @user_id');

    // Success
    return res.json({
      success: true,
      message: 'Login successful!',
      user: {
        user_id:      user.user_id,
        username:     user.username,
        first_name:   user.first_name,
        last_name:    user.last_name,
        email:        user.email,
        role:         user.role,
        tenant_id:    user.tenant_id,
        company_name: user.company_name
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error: ' + err.message
    });
  }
});

module.exports = router;