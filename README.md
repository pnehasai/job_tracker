# Job Application Tracker System

A comprehensive job application tracking system with MySQL backend and Python UI.

## Features
- User registration and authentication
- Job application management
- Interview scheduling and reminders
- Application status tracking
- Notifications system
- Admin dashboard

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Socket.IO Client

### Backend
- Node.js
- Express.js
- Socket.IO

### Database
- MySQL

### Database Features
- Stored Procedures
- Functions
- Triggers

## Project Structure

```plaintext
job-tracker/
│
├── frontend/          # React + TypeScript frontend
│
├── backend/           # Node.js + Express backend
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── job_tracker.sql    # MySQL database schema
└── README.md
```

## Database Setup

1. Open MySQL Workbench.
2. Create a database named:

```sql
CREATE DATABASE job_tracker;
```

3. Import:

```plaintext
job_tracker.sql
```

4. Verify that all tables are created successfully.

---

## Backend Setup

Open PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Run the backend:

```bash
npm run dev
```

Backend runs on:

```plaintext
http://localhost:4000
```

---

## Frontend Setup

Open another PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

Frontend runs on:

```plaintext
http://localhost:5173
```

---

## Environment Variables

Create a `.env` file inside the `backend` folder:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=job_tracker
DB_PORT=3306
PORT=4000
```

---

## Real-Time Notifications

The application uses **Socket.IO** for real-time notifications.

When an admin creates a notification, the backend automatically pushes it to the corresponding user without requiring a page refresh.

---

## API Health Check

Endpoint:

```http
GET /api/health
```

Expected Response:

```json
{
  "ok": true,
  "db": true
}
```
