const express = require('express');
const router  = express.Router();
const { sql, poolPromise } = require('../db');

// GET all pipeline stages (Super Admin)
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT ps.*, t.company_name
        FROM Pipeline_Stages ps
        LEFT JOIN Tenants t ON ps.tenant_id = t.tenant_id
        ORDER BY ps.tenant_id, ps.stage_order ASC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET pipeline stages by tenant
router.get('/tenant/:tenant_id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('tenant_id', sql.Int, req.params.tenant_id)
      .query(`
        SELECT * FROM Pipeline_Stages
        WHERE tenant_id = @tenant_id
        ORDER BY stage_order ASC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD pipeline stage
router.post('/add', async (req, res) => {
  try {
    const { tenant_id, stage_name, stage_order, probability_percent } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('tenant_id',          sql.Int,     tenant_id)
      .input('stage_name',         sql.VarChar, stage_name)
      .input('stage_order',        sql.Int,     stage_order)
      .input('probability_percent',sql.Int,     probability_percent || 0)
      .query(`
        INSERT INTO Pipeline_Stages (tenant_id, stage_name, stage_order, probability_percent)
        VALUES (@tenant_id, @stage_name, @stage_order, @probability_percent)
      `);
    res.json({ message: '✅ Pipeline stage added!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE pipeline stage
router.put('/update/:id', async (req, res) => {
  try {
    const { stage_name, stage_order, probability_percent } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('stage_name',         sql.VarChar, stage_name)
      .input('stage_order',        sql.Int,     stage_order)
      .input('probability_percent',sql.Int,     probability_percent)
      .input('stage_id',           sql.Int,     req.params.id)
      .query(`
        UPDATE Pipeline_Stages SET
          stage_name          = @stage_name,
          stage_order         = @stage_order,
          probability_percent = @probability_percent
        WHERE stage_id = @stage_id
      `);
    res.json({ message: '✅ Pipeline stage updated!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE pipeline stage
router.delete('/delete/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('stage_id', sql.Int, req.params.id)
      .query('DELETE FROM Pipeline_Stages WHERE stage_id = @stage_id');
    res.json({ message: '✅ Pipeline stage deleted!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
