// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const http = require('http');
const { Server: IOServer } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'job_tracker';
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

let pool;
async function createPool() {
  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // decimalNumbers: true,
  });
  // quick ping to fail early if DB unreachable
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  console.log('✅ Connected to MySQL database:', DB_NAME);
}
createPool().catch(err => {
  console.error('❌ MySQL pool create error:', err);
  process.exitCode = 1;
});

async function runQuery(sql, params = []) {
  if (!pool) throw new Error('Database pool not initialized');
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/* ----------------------
   Health
   ---------------------- */
app.get('/api/health', (req, res) => res.json({ ok: true, db: !!pool }));

/* ----------------------
   Auth - Users
   ---------------------- */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const rows = await runQuery('SELECT userID, name, email, contact_info FROM `User` WHERE email = ? AND password = ?', [email, password]);
    if (!rows || rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    return res.json({ user: rows[0] });
  } catch (err) {
    console.error('/api/auth/login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, contact, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password required' });

    const exists = await runQuery('SELECT userID FROM `User` WHERE email = ?', [email]);
    if (exists && exists.length) return res.status(409).json({ error: 'User exists' });

    const ins = await runQuery('INSERT INTO `User` (name, email, password, contact_info) VALUES (?, ?, ?, ?)', [name, email, password, contact || '']);
    const rows = await runQuery('SELECT userID, name, email, contact_info FROM `User` WHERE userID = ?', [ins.insertId]);
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error('/api/auth/register error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* ----------------------
   Admin login (dev logging)
   ---------------------- */
app.post('/api/admin/login', async (req, res) => {
  try {
    console.log('POST /api/admin/login body:', req.body);
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const rows = await runQuery('SELECT adminID, name, email, password FROM Admin WHERE email = ?', [email]);
    console.log('Admin row for email=', email, ':', rows && rows.length ? rows[0] : 'NOT FOUND');

    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials: admin not found' });
    }

    const adminRow = rows[0];
    if (password !== adminRow.password) {
      return res.status(401).json({
        error: 'Invalid credentials: password mismatch',
        hint: `storedPasswordLength=${(adminRow.password || '').length}`
      });
    }

    return res.json({ admin: { adminID: adminRow.adminID, name: adminRow.name, email: adminRow.email } });
  } catch (err) {
    console.error('/api/admin/login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* ----------------------
   Applications
   GET /api/applications
   PATCH /api/applications/:id  (status)
   DELETE /api/applications/:id
   ---------------------- */
app.get('/api/applications', async (req, res) => {
  try {
    const rows = await runQuery(
      `SELECT a.applicationID,
              a.userID,
              u.name AS userName,
              u.email AS userEmail,
              a.roleID,
              a.applicationDate,
              a.deadline,
              a.status,
              r.roleTitle,
              r.companyID AS roleCompanyID,
              c.companyName,
              c.location AS companyLocation
       FROM JobApplication a
       LEFT JOIN \`User\` u ON a.userID = u.userID
       LEFT JOIN JobRole r ON a.roleID = r.roleID
       LEFT JOIN Company c ON r.companyID = c.companyID
       ORDER BY a.applicationID DESC`
    );
    return res.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error('GET /api/applications error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/api/applications/:id', async (req, res) => {
  try {
    const applicationID = Number(req.params.id);
    const { status } = req.body || {};
    if (!applicationID || !status) return res.status(400).json({ error: 'applicationID and status required' });

    await runQuery('UPDATE JobApplication SET status = ? WHERE applicationID = ?', [status, applicationID]);
    const updated = await runQuery('SELECT * FROM JobApplication WHERE applicationID = ?', [applicationID]);
    return res.json({ application: updated && updated[0] ? updated[0] : null });
  } catch (err) {
    console.error('PATCH /api/applications/:id error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/applications/:id', async (req, res) => {
  try {
    const applicationID = Number(req.params.id);
    if (!applicationID) return res.status(400).json({ error: 'applicationID required' });
    await runQuery('DELETE FROM JobApplication WHERE applicationID = ?', [applicationID]);
    return res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/applications/:id error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* ----------------------
   Users
   GET /api/users
   GET /api/users/:userID/applications
   ---------------------- */
app.get('/api/users', async (req, res) => {
  try {
    const rows = await runQuery('SELECT userID, name, email, contact_info FROM `User` ORDER BY userID DESC');
    return res.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error('GET /api/users error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/users/:userID/applications', async (req, res) => {
  try {
    const userID = Number(req.params.userID);
    if (!userID) return res.status(400).json({ error: 'Invalid userID' });

    const rows = await runQuery(
      `SELECT a.applicationID, a.userID, a.roleID, a.applicationDate, a.deadline, a.status,
              r.roleTitle, r.companyID AS roleCompanyID, c.companyName
       FROM JobApplication a
       LEFT JOIN JobRole r ON a.roleID = r.roleID
       LEFT JOIN Company c ON r.companyID = c.companyID
       WHERE a.userID = ?
       ORDER BY a.applicationID DESC`,
      [userID]
    );
    return res.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error('GET /api/users/:userID/applications error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* ----------------------
   Jobs / Roles
   GET /api/jobs
   POST /api/roles
   POST /api/jobs/:roleID/apply
   ---------------------- */
app.get('/api/jobs', async (req, res) => {
  try {
    const rows = await runQuery(
      `SELECT r.*, c.companyName, c.location as companyLocation
       FROM JobRole r
       LEFT JOIN Company c ON r.companyID = c.companyID
       ORDER BY r.roleID DESC`
    );
    return res.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error('GET /api/jobs error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/roles', async (req, res) => {
  try {
    const { companyID, roleTitle, jobType, description, salaryRange, location } = req.body || {};
    if (!companyID || !roleTitle) return res.status(400).json({ error: 'companyID and roleTitle required' });

    const result = await runQuery(
      `INSERT INTO JobRole (companyID, roleTitle, jobType, description, salaryRange, location)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [companyID, roleTitle, jobType || '', description || '', salaryRange || '', location || '']
    );
    const rows = await runQuery('SELECT * FROM JobRole WHERE roleID = ?', [result.insertId]);
    return res.json(rows && rows[0] ? rows[0] : null);
  } catch (err) {
    console.error('POST /api/roles error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/jobs/:roleID/apply  -- normalize dates and handle optional resume/coverLetter
app.post('/api/jobs/:roleID/apply', async (req, res) => {
  try {
    const roleID = Number(req.params.roleID);
    const { userID, applicationDate, deadline, resume, coverLetter } = req.body || {};

    console.log('POST /api/jobs/%d/apply body1:', roleID, req.body);

    if (!roleID || !userID) {
      return res.status(400).json({ error: 'roleID and userID are required' });
    }

    const normalizeToDate = (val) => {
      if (!val) return null;
      if (typeof val === 'string' && val.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(val)) {
        return val.slice(0, 10);
      }
      const d = new Date(val);
      if (isNaN(d.getTime())) return null;
      const yyyy = d.getFullYear().toString().padStart(4, '0');
      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
      const dd = d.getDate().toString().padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const appDateNormalized = normalizeToDate(applicationDate) || new Date().toISOString().slice(0, 10);
    const deadlineNormalized = normalizeToDate(deadline);

    console.log('Normalized dates -> applicationDate:', appDateNormalized, 'deadline:', deadlineNormalized);

    const insertSql = `INSERT INTO JobApplication (userID, roleID, applicationDate, deadline, status${resume ? ', resume' : ''}${coverLetter ? ', coverLetter' : ''})
                       VALUES (?, ?, ?, ?, 'Applied'${resume ? ', ?' : ''}${coverLetter ? ', ?' : ''})`;

    const params = [userID, roleID, appDateNormalized, deadlineNormalized];
    if (resume) params.push(resume);
    if (coverLetter) params.push(coverLetter);

    const result = await runQuery(insertSql, params);
    console.log('Inserted application id=', result.insertId);

    const insertedRows = await runQuery('SELECT applicationID, userID, roleID, applicationDate, deadline, status FROM JobApplication WHERE applicationID = ?', [result.insertId]);
    const application = insertedRows && insertedRows[0] ? insertedRows[0] : null;

    return res.json({ application });
  } catch (err) {
    console.error('POST /api/jobs/:roleID/apply error', err);
    return res.status(500).json({ error: 'Server error', detail: err?.message?.toString?.() || '' });
  }
});

/* ----------------------
   Companies
   GET /api/companies
   POST /api/companies
   ---------------------- */
app.get('/api/companies', async (req, res) => {
  try {
    const rows = await runQuery('SELECT companyID, companyName, location, contactInfo, industry, city, country FROM Company ORDER BY companyID DESC');
    return res.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error('GET /api/companies error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/companies', async (req, res) => {
  try {
    const { companyName, location, contactInfo, industry, city, country } = req.body || {};
    if (!companyName) return res.status(400).json({ error: 'companyName is required' });

    const result = await runQuery(
      `INSERT INTO Company (companyName, location, contactInfo, industry, city, country)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [companyName, location || '', contactInfo || '', industry || '', city || '', country || '']
    );

    const rows = await runQuery('SELECT * FROM Company WHERE companyID = ?', [result.insertId]);
    return res.json(rows && rows[0] ? rows[0] : null);
  } catch (err) {
    console.error('POST /api/companies error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* ----------------------
   Interviews
   POST /api/interviews
   ---------------------- */
// POST /api/interviews
app.post('/api/interviews', async (req, res) => {
  try {
    const { applicationID, interviewDate, interviewMode, result } = req.body || {};
    if (!applicationID || !interviewDate || !interviewMode) {
      return res.status(400).json({ error: 'applicationID, interviewDate and interviewMode required' });
    }

    // Insert interview row
    const insert = await runQuery(
      `INSERT INTO Interview (applicationID, interviewDate, interviewMode, result)
       VALUES (?, ?, ?, ?)`,
      [applicationID, interviewDate, interviewMode, result || 'Pending']
    );

    const interviewRows = await runQuery('SELECT * FROM Interview WHERE interviewID = ?', [insert.insertId]);
    const interview = interviewRows && interviewRows[0] ? interviewRows[0] : null;

    // Update JobApplication status to 'Interview' unless it is already Rejected/Selected or a later state
    // Fetch current status
    const appRows = await runQuery('SELECT applicationID, status, userID FROM JobApplication WHERE applicationID = ?', [applicationID]);
    if (appRows && appRows.length > 0) {
      const app = appRows[0];
      const currentStatus = (app.status || '').toString();
      const immutableStates = ['Selected', 'Rejected']; // if application is already final, don't override
      if (!immutableStates.includes(currentStatus) && currentStatus !== 'Interview') {
        await runQuery('UPDATE JobApplication SET status = ? WHERE applicationID = ?', ['Interview', applicationID]);
      }

      // Create a Notification row (delivered=0) so backend poller will push it to the user
      try {
        await runQuery(
          `INSERT INTO Notification (type, date, time, applicationID, adminID, delivered, isRead)
           VALUES (?, ?, ?, ?, NULL, 0, 0)`,
          [`Interview scheduled on ${interviewDate}`, new Date().toISOString().slice(0,10), new Date().toTimeString().split(' ')[0], applicationID]
        );
      } catch (notifErr) {
        console.warn('Failed to insert notification for interview:', notifErr);
        // don't fail the whole request for notification failure
      }
    }

    // Return the new interview and the (possibly updated) application
    const updatedAppRows = await runQuery('SELECT applicationID, userID, roleID, applicationDate, deadline, status FROM JobApplication WHERE applicationID = ?', [applicationID]);
    const updatedApp = updatedAppRows && updatedAppRows[0] ? updatedAppRows[0] : null;

    return res.json({ interview, application: updatedApp });
  } catch (err) {
    console.error('POST /api/interviews error:', err);
    return res.status(500).json({ error: 'Server error', detail: err?.message?.toString?.() || '' });
  }
});


/* ----------------------
   Notifications
   POST /api/notifications
   GET /api/notifications/:userID
   ---------------------- */
app.post('/api/notifications', async (req, res) => {
  try {
    const { type, date, time, applicationID, adminID } = req.body || {};
    if (!type || !applicationID) return res.status(400).json({ error: 'type and applicationID required' });

    const result = await runQuery(
      `INSERT INTO Notification (type, date, time, applicationID, adminID, delivered, isRead)
       VALUES (?, ?, ?, ?, ?, 0, 0)`,
      [type, date || new Date().toISOString().slice(0, 10), time || new Date().toTimeString().split(' ')[0], applicationID, adminID || null]
    );

    const rows = await runQuery('SELECT * FROM Notification WHERE notificationID = ?', [result.insertId]);
    return res.json({ notification: rows && rows[0] ? rows[0] : null });
  } catch (err) {
    console.error('POST /api/notifications error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/notifications/:userID', async (req, res) => {
  try {
    const userID = Number(req.params.userID);
    if (!userID && userID !== 0) return res.status(400).json({ error: 'Invalid userID' });

    const rows = await runQuery(
      `SELECT n.notificationID, n.type, n.date, n.time, n.applicationID, n.adminID,
              a.userID AS appUserID, r.roleTitle, c.companyName, n.delivered, n.isRead
       FROM Notification n
       LEFT JOIN JobApplication a ON n.applicationID = a.applicationID
       LEFT JOIN JobRole r ON a.roleID = r.roleID
       LEFT JOIN Company c ON r.companyID = c.companyID
       WHERE a.userID = ?
       ORDER BY n.notificationID DESC`,
      [userID]
    );
    return res.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error('GET /api/notifications/:userID error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* ----------------------
   404 fallback
   ---------------------- */
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

/* ----------------------
   Socket.IO and notification poller
   ---------------------- */
const server = http.createServer(app);
const io = new IOServer(server, {
  cors: { origin: '*' } // tighten for production
});

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('identify', (payload) => {
    try {
      const uid = payload && (payload.userID || payload.userID === 0) ? Number(payload.userID) : null;
      if (uid !== null && !isNaN(uid)) {
        const room = `user:${uid}`;
        socket.join(room);
        console.log(`socket ${socket.id} joined room ${room}`);
      }
    } catch (e) {
      console.warn('identify error', e);
    }
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
  });
});

const NOTIF_POLL_INTERVAL_MS = process.env.NOTIF_POLL_INTERVAL_MS ? parseInt(process.env.NOTIF_POLL_INTERVAL_MS, 10) : 3000;

async function pushPendingNotifications() {
  try {
    const rows = await runQuery(
      `SELECT n.notificationID, n.type, n.date, n.time, n.applicationID, n.adminID,
              a.userID AS appUserID
       FROM Notification n
       JOIN JobApplication a ON n.applicationID = a.applicationID
       WHERE n.delivered = 0`
    );

    if (!rows || rows.length === 0) return;

    for (const r of rows) {
      const userId = r.appUserID;
      const room = `user:${userId}`;

      const payload = {
        notificationID: r.notificationID,
        type: r.type,
        date: r.date,
        time: r.time,
        applicationID: r.applicationID,
        adminID: r.adminID
      };

      io.to(room).emit('notification', payload);
      console.log('emitted notification to', room, payload);
      await runQuery('UPDATE Notification SET delivered = 1 WHERE notificationID = ?', [r.notificationID]);
    }
  } catch (err) {
    console.error('pushPendingNotifications error:', err);
  }
}

setInterval(() => {
  pushPendingNotifications().catch(err => console.error('pushPendingNotifications top error', err));
}, NOTIF_POLL_INTERVAL_MS);

/* ----------------------
   Start server (http + socket)
   ---------------------- */
server.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
