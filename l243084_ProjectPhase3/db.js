const sql = require('mssql');

const config = {
  server: 'kainat\\SQLEXPRESS',
  database: 'MultiTenant_CRM',
  user: 'sa',
  password: '12345',
  options: {
    trustServerCertificate: true,
    enableArithAbort: true,
    encrypt: false
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('✅ Connected to SQL Server!');
    return pool;
  })
  .catch(err => {
    console.log('❌ Database connection failed:', err);
  });

module.exports = { sql, poolPromise };