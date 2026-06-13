const express = require('express');
const router  = express.Router();
const { sql, poolPromise } = require('../db');

// GET all custom fields by tenant
router.get('/tenant/:tenant_id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('tenant_id', sql.Int, req.params.tenant_id)
      .query(`
        SELECT * FROM Custom_Fields
        WHERE tenant_id = @tenant_id
        ORDER BY entity_type, display_order ASC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET custom fields by entity type (e.g. contact, lead)
router.get('/tenant/:tenant_id/entity/:entity_type', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('tenant_id',   sql.Int,     req.params.tenant_id)
      .input('entity_type', sql.VarChar, req.params.entity_type)
      .query(`
        SELECT * FROM Custom_Fields
        WHERE tenant_id = @tenant_id AND entity_type = @entity_type
        ORDER BY display_order ASC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD new custom field
router.post('/add', async (req, res) => {
  try {
    const { tenant_id, entity_type, field_name, field_type, field_options, is_required, display_order } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('tenant_id',     sql.Int,     tenant_id)
      .input('entity_type',   sql.VarChar, entity_type)
      .input('field_name',    sql.VarChar, field_name)
      .input('field_type',    sql.VarChar, field_type)
      .input('field_options', sql.VarChar, field_options || null)
      .input('is_required',   sql.Bit,     is_required ? 1 : 0)
      .input('display_order', sql.Int,     display_order || 0)
      .query(`
        INSERT INTO Custom_Fields
          (tenant_id, entity_type, field_name, field_type, field_options, is_required, display_order)
        VALUES
          (@tenant_id, @entity_type, @field_name, @field_type, @field_options, @is_required, @display_order)
      `);
    res.json({ message: '✅ Custom field added!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE custom field
router.put('/update/:id', async (req, res) => {
  try {
    const { field_name, field_type, field_options, is_required, is_active, display_order } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('field_name',    sql.VarChar, field_name)
      .input('field_type',    sql.VarChar, field_type)
      .input('field_options', sql.VarChar, field_options || null)
      .input('is_required',   sql.Bit,     is_required ? 1 : 0)
      .input('is_active',     sql.Bit,     is_active   ? 1 : 0)
      .input('display_order', sql.Int,     display_order || 0)
      .input('field_id',      sql.Int,     req.params.id)
      .query(`
        UPDATE Custom_Fields SET
          field_name    = @field_name,
          field_type    = @field_type,
          field_options = @field_options,
          is_required   = @is_required,
          is_active     = @is_active,
          display_order = @display_order
        WHERE field_id = @field_id
      `);
    res.json({ message: '✅ Custom field updated!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE custom field
router.delete('/delete/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('field_id', sql.Int, req.params.id)
      .query('DELETE FROM Custom_Fields WHERE field_id = @field_id');
    res.json({ message: '✅ Custom field deleted!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;