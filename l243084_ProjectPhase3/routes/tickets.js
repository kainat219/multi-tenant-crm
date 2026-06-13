const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// GET all tickets (Super Admin)
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT
          st.ticket_id, st.subject, st.description, st.priority, st.status,
          st.created_at, st.resolved_at,
          t.company_name,
          a.account_name,
          c.first_name + ' ' + c.last_name AS contact_name,
          u.first_name + ' ' + u.last_name AS assigned_user
        FROM Support_Tickets st
        LEFT JOIN Tenants  t ON st.tenant_id       = t.tenant_id
        LEFT JOIN Accounts a ON st.account_id       = a.account_id
        LEFT JOIN Contacts c ON st.contact_id       = c.contact_id
        LEFT JOIN Users    u ON st.assigned_user_id = u.user_id
        ORDER BY st.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET tickets by tenant (Tenant Admin)
router.get('/tenant/:tenant_id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('tenant_id', sql.Int, req.params.tenant_id)
      .query(`
        SELECT
          st.ticket_id, st.subject, st.description, st.priority, st.status,
          st.created_at, st.resolved_at,
          a.account_name,
          c.first_name + ' ' + c.last_name AS contact_name,
          u.first_name + ' ' + u.last_name AS assigned_user
        FROM Support_Tickets st
        LEFT JOIN Accounts a ON st.account_id       = a.account_id
        LEFT JOIN Contacts c ON st.contact_id       = c.contact_id
        LEFT JOIN Users    u ON st.assigned_user_id = u.user_id
        WHERE st.tenant_id = @tenant_id
        ORDER BY st.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET tickets assigned to agent (Sales/Support Agent)
router.get('/agent/:user_id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('user_id', sql.Int, req.params.user_id)
      .query(`
        SELECT
          st.ticket_id, st.subject, st.description, st.priority, st.status,
          st.created_at, st.resolved_at,
          a.account_name,
          c.first_name + ' ' + c.last_name AS contact_name
        FROM Support_Tickets st
        LEFT JOIN Accounts a ON st.account_id = a.account_id
        LEFT JOIN Contacts c ON st.contact_id = c.contact_id
        WHERE st.assigned_user_id = @user_id
        ORDER BY st.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD new ticket
router.post('/add', async (req, res) => {
  try {
    const { tenant_id, account_id, contact_id, assigned_user_id, subject, description, priority, status } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('tenant_id',       sql.Int,     tenant_id || 1)
      .input('account_id',      sql.Int,     account_id || null)
      .input('contact_id',      sql.Int,     contact_id || null)
      .input('assigned_user_id',sql.Int,     assigned_user_id || null)
      .input('subject',         sql.VarChar, subject)
      .input('description',     sql.VarChar, description)
      .input('priority',        sql.VarChar, priority || 'medium')
      .input('status',          sql.VarChar, status || 'open')
      .query(`
        INSERT INTO Support_Tickets
          (tenant_id, account_id, contact_id, assigned_user_id, subject, description, priority, status)
        VALUES
          (@tenant_id, @account_id, @contact_id, @assigned_user_id, @subject, @description, @priority, @status)
      `);
    res.json({ message: '✅ Ticket added successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE ticket status
router.put('/update/:id', async (req, res) => {
  try {
    const { status, priority, assigned_user_id } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('status',          sql.VarChar, status)
      .input('priority',        sql.VarChar, priority)
      .input('assigned_user_id',sql.Int,     assigned_user_id || null)
      .input('resolved_at',     sql.DateTime, status === 'resolved' || status === 'closed' ? new Date() : null)
      .input('ticket_id',       sql.Int,     req.params.id)
      .query(`
        UPDATE Support_Tickets SET
          status           = @status,
          priority         = @priority,
          assigned_user_id = @assigned_user_id,
          resolved_at      = CASE WHEN @resolved_at IS NOT NULL THEN @resolved_at ELSE resolved_at END
        WHERE ticket_id = @ticket_id
      `);
    res.json({ message: '✅ Ticket updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE ticket
router.delete('/delete/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('ticket_id', sql.Int, req.params.id)
      .query('DELETE FROM Support_Tickets WHERE ticket_id = @ticket_id');
    res.json({ message: '✅ Ticket deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET comments for a ticket
router.get('/:ticket_id/comments', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('ticket_id', sql.Int, req.params.ticket_id)
      .query(`
        SELECT tc.*, u.first_name + ' ' + u.last_name AS user_name
        FROM Ticket_Comments tc
        LEFT JOIN Users u ON tc.user_id = u.user_id
        WHERE tc.ticket_id = @ticket_id
        ORDER BY tc.created_at ASC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD comment to a ticket
router.post('/:ticket_id/comments', async (req, res) => {
  try {
    const { user_id, comment_text, is_internal } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('ticket_id',    sql.Int,     req.params.ticket_id)
      .input('user_id',      sql.Int,     user_id)
      .input('comment_text', sql.VarChar, comment_text)
      .input('is_internal',  sql.Bit,     is_internal ? 1 : 0)
      .query(`
        INSERT INTO Ticket_Comments (ticket_id, user_id, comment_text, is_internal)
        VALUES (@ticket_id, @user_id, @comment_text, @is_internal)
      `);
    res.json({ message: '✅ Comment added!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
