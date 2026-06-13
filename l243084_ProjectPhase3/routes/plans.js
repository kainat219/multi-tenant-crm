const express = require('express');
const router  = express.Router();
const { sql, poolPromise } = require('../db');

const DEFAULT_PLANS = [
  {
    plan_name: 'Free Trial',
    max_users: 3,
    max_contacts: 100,
    price_monthly: 0,
    features: 'Basic CRM features for evaluation'
  },
  {
    plan_name: 'Starter',
    max_users: 5,
    max_contacts: 500,
    price_monthly: 1000,
    features: 'Lead tracking, contacts, accounts, and basic reports'
  },
  {
    plan_name: 'Standard',
    max_users: 10,
    max_contacts: 1000,
    price_monthly: 3000,
    features: 'Sales pipeline, activities, opportunities, and support tickets'
  },
  {
    plan_name: 'Pro',
    max_users: 25,
    max_contacts: 5000,
    price_monthly: 7000,
    features: 'Advanced CRM features, analytics, and team management'
  },
  {
    plan_name: 'Premium',
    max_users: 50,
    max_contacts: 10000,
    price_monthly: 12000,
    features: 'Premium support, automation, and larger team limits'
  },
  {
    plan_name: 'Enterprise',
    max_users: 100,
    max_contacts: 50000,
    price_monthly: 20000,
    features: 'Enterprise scale users, contacts, support, and customization'
  }
];

async function ensurePlansTable(pool) {
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
  `);
}

async function seedDefaultPlansIfEmpty(pool) {
  await ensurePlansTable(pool);

  const countResult = await pool.request()
    .query('SELECT COUNT(*) AS plan_count FROM Subscription_Plans');

  if (countResult.recordset[0].plan_count > 0) {
    return;
  }

  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    for (const plan of DEFAULT_PLANS) {
      await new sql.Request(transaction)
        .input('plan_name',     sql.VarChar,       plan.plan_name)
        .input('max_users',     sql.Int,           plan.max_users)
        .input('max_contacts',  sql.Int,           plan.max_contacts)
        .input('price_monthly', sql.Decimal(10, 2), plan.price_monthly)
        .input('features',      sql.VarChar,       plan.features)
        .query(`
          INSERT INTO Subscription_Plans
            (plan_name, max_users, max_contacts, price_monthly, features)
          VALUES
            (@plan_name, @max_users, @max_contacts, @price_monthly, @features)
        `);
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// GET all plans
router.get('/', async (req, res) => {
  try {
    const pool   = await poolPromise;
    if (!pool) {
      throw new Error('Database connection is not available. Check SQL Server connection in db.js.');
    }

    await seedDefaultPlansIfEmpty(pool);

    const result = await pool.request()
      .query(`
        SELECT
          plan_id,
          plan_name,
          max_users,
          max_contacts,
          price_monthly,
          features,
          is_active
        FROM Subscription_Plans
        ORDER BY price_monthly ASC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD new plan
router.post('/add', async (req, res) => {
  try {
    const {
      plan_name,
      max_users,
      max_contacts,
      price_monthly,
      features
    } = req.body;

    const pool = await poolPromise;
    if (!pool) {
      throw new Error('Database connection is not available. Check SQL Server connection in db.js.');
    }

    await ensurePlansTable(pool);

    await pool.request()
      .input('plan_name',     sql.VarChar, plan_name)
      .input('max_users',     sql.Int,     max_users)
      .input('max_contacts',  sql.Int,     max_contacts)
      .input('price_monthly', sql.Decimal, price_monthly)
      .input('features',      sql.VarChar, features)
      .query(`
        INSERT INTO Subscription_Plans
          (plan_name, max_users, max_contacts, price_monthly, features)
        VALUES
          (@plan_name, @max_users, @max_contacts, @price_monthly, @features)
      `);
    res.json({ message: '✅ Plan added successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE plan
router.put('/update/:id', async (req, res) => {
  try {
    const { plan_name, max_users, max_contacts, price_monthly, features } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('plan_name',     sql.VarChar, plan_name)
      .input('max_users',     sql.Int,     max_users)
      .input('max_contacts',  sql.Int,     max_contacts)
      .input('price_monthly', sql.Decimal, price_monthly)
      .input('features',      sql.VarChar, features)
      .input('plan_id',       sql.Int,     req.params.id)
      .query(`
        UPDATE Subscription_Plans
        SET
          plan_name     = @plan_name,
          max_users     = @max_users,
          max_contacts  = @max_contacts,
          price_monthly = @price_monthly,
          features      = @features
        WHERE plan_id = @plan_id
      `);
    res.json({ message: '✅ Plan updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle plan status
router.put('/status/:id', async (req, res) => {
  try {
    const { is_active } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('is_active', sql.Bit, is_active)
      .input('plan_id',   sql.Int, req.params.id)
      .query('UPDATE Subscription_Plans SET is_active = @is_active WHERE plan_id = @plan_id');
    res.json({ message: '✅ Plan status updated!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE plan
router.delete('/delete/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('plan_id', sql.Int, req.params.id)
      .query('DELETE FROM Subscription_Plans WHERE plan_id = @plan_id');
    res.json({ message: '✅ Plan deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
