# Officials Management System

A web-based application for managing church officials, their categories, and photographs. The system provides an admin dashboard for management and a public-facing page for displaying officials organized by category.

## Features

- **Admin Dashboard**: Full CRUD operations for managing officials
- **Public Page**: Responsive display of officials grouped by category
- **REST API**: Complete backend API for integration
- **Image Upload**: Support for official photographs with validation
- **Category Limits**: Enforced limits on officials per category

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **File Handling**: Multer for image uploads
- **API Communication**: Fetch API

---

## Prerequisites

- Node.js v16 or higher
- PostgreSQL v13 or higher
- npm or yarn
- Git

---

## Project Structure

```
weekend2/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── officialsController.js
│   ├── middleware/
│   │   └── upload.js
│   ├── routes/
│   │   └── officialsRoutes.js
│   ├── uploads/
│   ├── .env
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── admin/
│   │   ├── index.html
│   │   ├── css/
│   │   │   └── admin.css
│   │   └── js/
│   │       └── admin.js
│   └── official/
│       ├── index.html
│       ├── css/
│       │   └── official.css
│       └── js/
│           └── official.js
├── database/
│   └── schema.sql
├── .env.example
└── README.md
```

---

## Installation Steps

### Step 1: Clone/Download the Project

```bash
git clone <repository-url>
cd weekend2
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Configure Environment Variables

Copy the `.env.example` file to `.env` and edit it with your PostgreSQL credentials:

```bash
copy .env.example .env  # Windows
# OR
cp .env.example .env   # Linux/Mac
```

Edit the `.env` file with your configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=officials_db
DB_USER=postgres
DB_PASSWORD=your_password

# Server Configuration
PORT=3000
NODE_ENV=development
```

**Variable Descriptions:**

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL server hostname | localhost |
| `DB_PORT` | PostgreSQL server port | 5432 |
| `DB_NAME` | Database name | officials_db |
| `DB_USER` | PostgreSQL username | postgres |
| `DB_PASSWORD` | PostgreSQL password | (required) |
| `PORT` | Backend server port | 3000 |
| `NODE_ENV` | Environment mode | development |

### Step 4: Set Up PostgreSQL Database

1. Install PostgreSQL if not already installed
2. Create the database:

```bash
psql -U postgres
CREATE DATABASE officials_db;
\c officials_db
\i backend/schema.sql
```

3. Verify table creation:

```sql
\d officials
```

### Step 5: Create Uploads Directory

```bash
mkdir backend/uploads
```

### Step 6: Start the Backend Server

```bash
cd backend
npm run dev
```

The server will start at `http://localhost:3000`

**Alternative startup:**
```bash
cd backend
node server.js
```

### Step 7: Access the Frontend

- **Admin Dashboard**: Open `frontend/admin/index.html`
- **Public Page**: Open `frontend/official/index.html`

**Recommended:** Use a local server for best results:
- VS Code: Use the "Live Server" extension
- Node.js: `npx http-server frontend`

---

## API Endpoints Documentation

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/officials` | Get all officials | - | Array of officials |
| GET | `/api/officials/:id` | Get official by ID | - | Single official |
| POST | `/api/officials` | Create official | multipart/form-data | Created official |
| PUT | `/api/officials/:id` | Update official | multipart/form-data | Updated official |
| DELETE | `/api/officials/:id` | Delete official | - | Success message |

### Success Response Format

```json
{
    "success": true,
    "data": { ... }
}
```

### Error Response Format

```json
{
    "success": false,
    "message": "Error description"
}
```

---

## Category Limits Reference

The system enforces the following maximum limits per category:

| Category | Maximum Allowed |
|----------|-----------------|
| Executive | 7 |
| Jumuia | 2 |
| Bible | 2 |
| Rosary | 2 |
| Liturgist | 2 |
| Choir | 2 |
| Catechist | 1 |

---

## Usage Guide

### Admin Dashboard

#### Adding a New Official

1. Navigate to the Admin Dashboard
2. Click the "Add Official" button
3. Fill in the required fields:
   - Full Name
   - Category (select from dropdown)
   - Role/Position
   - Phone Number
   - Upload Photo
4. Click "Submit"

**Note:** If the selected category has reached its maximum limit, the form will prevent submission and show a warning.

#### Editing an Official

1. Find the official in the list
2. Click the "Edit" button
3. Modify the desired fields
4. Click "Update" to save changes

#### Deleting an Official

1. Find the official in the list
2. Click the "Delete" button
3. Confirm the deletion

#### Understanding Category Limits (Color Coding)

- **Green**: Category has available slots
- **Orange**: Category is near capacity (1 slot remaining)
- **Red**: Category is at full capacity

### Public Page

#### Viewing Officials

- Officials are displayed in cards grouped by category
- Use the navigation sidebar to jump to specific categories
- Each card shows the official's name, role, and photo
- The page is fully responsive for mobile and desktop

---

## Troubleshooting Common Issues

### Database Connection Errors

**Problem:** `Connection refused` or `ECONNREFUSED`

**Solutions:**
1. Check that PostgreSQL service is running:
   ```bash
   # Windows
   net start postgresql-x64-13
   
   # Linux
   sudo systemctl status postgresql
   
   # macOS
   brew services start postgresql
   ```

2. Verify credentials in `.env` file
3. Ensure the database exists: `\l` in psql
4. Check that the database user has proper permissions

### Image Upload Issues

**Problem:** Images fail to upload or show 404

**Solutions:**
1. Verify `backend/uploads` directory exists
2. Check file size limit (5MB maximum)
3. Ensure file type is allowed: JPEG, JPG, PNG, GIF
4. Check console for specific error messages

### Port Already in Use

**Problem:** `EADDRINUSE: Port 3000 is already in use`

**Solutions:**
1. Change the PORT in `.env` file:
   ```env
   PORT=3001
   ```
2. Kill the process using port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -i :3000
   kill -9 <PID>
   ```

### CORS Errors

**Problem:** `Access to fetch at... has been blocked by CORS policy`

**Solutions:**
1. Ensure CORS middleware is enabled in `server.js`
2. Check that frontend API URLs match the backend address
3. Clear browser cache

### Category Limits Not Enforcing

**Problem:** Can add officials beyond category limits

**Solutions:**
1. Verify database has the `max_allowed` column
2. Check that the controller validates limits
3. Restart the backend server after changes

---

## Development Notes

### Adding New Dependencies

```bash
cd backend
npm install <package-name>
```

### Running in Production

1. Set environment variables:
   ```env
   NODE_ENV=production
   ```

2. Use a production-ready database

3. Consider using PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start server.js
   ```

4. Set up reverse proxy (Nginx/Apache)

### Project Structure Overview

- **backend/config/db.js**: Database connection configuration
- **backend/controllers/officialsController.js**: Business logic for officials
- **backend/middleware/upload.js**: Multer configuration for file uploads
- **backend/routes/officialsRoutes.js**: API route definitions
- **backend/server.js**: Express server entry point
- **frontend/admin/**: Admin dashboard frontend files
- **frontend/official/**: Public page frontend files

---

## File Upload Specifications

| Specification | Value |
|---------------|-------|
| Maximum File Size | 5MB |
| Allowed Formats | JPEG, JPG, PNG, GIF |
| Upload Path | `backend/uploads/` |
| Access URL | `http://localhost:3000/uploads/filename` |

---

## API Error Response Format

All API errors follow this format:

```json
{
    "success": false,
    "message": "Error description here"
}
```

### Common Error Messages

| Message | Cause |
|---------|-------|
| "Category has reached maximum limit" | Category is at capacity |
| "Official not found" | Invalid ID provided |
| "Database connection failed" | PostgreSQL unavailable |
| "File too large" | Upload exceeds 5MB limit |
| "Invalid file type" | Unsupported image format |

---

## License

This project is licensed under the MIT License.

---

## Contact/Support

For questions or issues, please contact:

- **Email**: support@example.com
- **GitHub Issues**: Report bugs and feature requests

---

## Acknowledgments

- Built with Node.js and Express
- Database powered by PostgreSQL
- Frontend uses vanilla JavaScript and CSS
"# jkcsa" 
