# Multi-Tenant CRM System

A full stack Customer Relationship Management (CRM) system built with Node.js and SQL Server that supports multiple tenants with complete data isolation and role-based access control.

---

## About the Project

This project was built as part of my Database Systems course at FAST-NUCES Lahore. The idea was to create a real-world CRM platform where multiple businesses (tenants) can use the same system independently — each with their own data, users, and settings — without ever seeing each other's information.

The system has three types of users: a Super Admin who manages the entire platform, Tenant Admins who manage their own business, and Sales Agents who handle day-to-day CRM tasks like leads and contacts.

---

## Features

- Multi-tenant architecture with complete data isolation between tenants
- Role-based access control (Super Admin, Tenant Admin, Sales Agent)
- Lead and contact management with conversion tracking
- Opportunity and sales pipeline management
- Ticketing system for customer support
- Billing and subscription plan management
- Email integration and notification system
- Custom fields support for flexible data entry
- Audit logs to track all system activity
- Clean and responsive frontend with separate dashboards per role

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | SQL Server (SSMS) |
| Frontend | HTML, CSS, JavaScript |
| Version Control | Git, GitHub |
| Project Management | Jira |

---

## Project Structure

```
├── server.js               # Main entry point
├── db.js                   # Database connection
├── routes/                 # All API routes
│   ├── auth.js
│   ├── leads.js
│   ├── contacts.js
│   ├── tenants.js
│   ├── users.js
│   ├── tickets.js
│   ├── billing.js
│   ├── audit.js
│   └── ...more
├── public/                 # Frontend HTML pages
│   ├── superAdmin/         # Super Admin dashboard & pages
│   ├── tenantAdmin/        # Tenant Admin dashboard & pages
│   ├── salesAgent/         # Sales Agent dashboard & pages
│   ├── landing.html
│   ├── login.html
│   └── register.html
└── package.json
```

---

## How to Run

1. Clone the repository
```bash
git clone https://github.com/kainat219/multi-tenant-crm.git
```

2. Install dependencies
```bash
npm install
```

3. Set up your SQL Server database and update connection settings in `db.js`

4. Start the server
```bash
node server.js
```

5. Open your browser and go to `http://localhost:3000/landing.html`

---

## What I Learned

Building this project taught me a lot about how real-world SaaS applications are structured. Working with multi-tenant database design was challenging but really interesting — making sure one tenant's data never leaks into another requires careful query design at every level. I also got hands-on experience with Node.js routing, SQL Server stored procedures, and managing a team project using Jira for task tracking.

---

## Author

**Kainat Afzal**  
BS Software Engineering — FAST-NUCES Lahore  
[LinkedIn](https://linkedin.com/in/kainat-afzal-) | [GitHub](https://github.com/kainat219)
