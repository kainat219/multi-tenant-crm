const express = require('express');
const router  = express.Router();
const { sql, poolPromise } = require('../db');

// GET all billing records (Super Admin)
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT br.*,
               t.company_name,
               sp.plan_name
        FROM Billing_Records br
        LEFT JOIN Tenants            t  ON br.tenant_id = t.tenant_id
        LEFT JOIN Subscription_Plans sp ON br.plan_id   = sp.plan_id
        ORDER BY br.billing_date DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET billing records by tenant
router.get('/tenant/:tenant_id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('tenant_id', sql.Int, req.params.tenant_id)
      .query(`
        SELECT br.*, sp.plan_name
        FROM Billing_Records br
        LEFT JOIN Subscription_Plans sp ON br.plan_id = sp.plan_id
        WHERE br.tenant_id = @tenant_id
        ORDER BY br.billing_date DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD billing record
router.post('/add', async (req, res) => {
  try {
    const {
      tenant_id, plan_id, billing_date, amount,
      payment_status, payment_method, invoice_number, due_date
    } = req.body;

    const pool = await poolPromise;
    await pool.request()
      .input('tenant_id',      sql.Int,     tenant_id)
      .input('plan_id',        sql.Int,     plan_id)
      .input('billing_date',   sql.Date,    billing_date)
      .input('amount',         sql.Decimal, amount)
      .input('payment_status', sql.VarChar, payment_status || 'pending')
      .input('payment_method', sql.VarChar, payment_method)
      .input('invoice_number', sql.VarChar, invoice_number)
      .input('due_date',       sql.Date,    due_date || null)
      .query(`
        INSERT INTO Billing_Records
          (tenant_id, plan_id, billing_date, amount,
           payment_status, payment_method, invoice_number, due_date)
        VALUES
          (@tenant_id, @plan_id, @billing_date, @amount,
           @payment_status, @payment_method, @invoice_number, @due_date)
      `);
    res.json({ message: '✅ Billing record added!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE billing record status
router.put('/update/:id', async (req, res) => {
  try {
    const { payment_status, payment_method } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('payment_status', sql.VarChar, payment_status)
      .input('payment_method', sql.VarChar, payment_method)
      .input('billing_id',     sql.Int,     req.params.id)
      .query(`
        UPDATE Billing_Records SET
          payment_status = @payment_status,
          payment_method = @payment_method
        WHERE billing_id = @billing_id
      `);
    res.json({ message: '✅ Billing record updated!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE billing record
router.delete('/delete/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('billing_id', sql.Int, req.params.id)
      .query('DELETE FROM Billing_Records WHERE billing_id = @billing_id');
    res.json({ message: '✅ Billing record deleted!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
