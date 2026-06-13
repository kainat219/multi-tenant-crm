const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// ===== Routes =====
app.use('/auth',          require('./routes/auth'));
app.use('/dashboard',     require('./routes/dashboard'));
app.use('/leads',         require('./routes/leads'));
app.use('/contacts',      require('./routes/contacts'));
app.use('/tenants',       require('./routes/tenants'));
app.use('/tickets',       require('./routes/tickets'));
app.use('/users',         require('./routes/users'));
app.use('/accounts',      require('./routes/accounts'));
app.use('/opportunities', require('./routes/opportunities'));
app.use('/plans',         require('./routes/plans'));
app.use('/activities',    require('./routes/activities'));
app.use('/billing',       require('./routes/billing'));
app.use('/audit',         require('./routes/audit'));
app.use('/pipeline',      require('./routes/pipeline'));
app.use('/notifications',     require('./routes/notifications'));
app.use('/customfields',      require('./routes/customFields'));
app.use('/emailintegrations', require('./routes/emailIntegrations'));
app.use('/leadconversions',   require('./routes/leadConversions'));

app.listen(3000, () => {
  console.log('✅ Server running on http://localhost:3000');
  exec('start http://localhost:3000/landing.html');
});

