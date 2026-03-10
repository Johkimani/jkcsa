# Officials Management System

A modern web-based application for managing church officials, their categories, and contact information. The system provides a secure admin dashboard for management and a beautiful public-facing page for displaying officials organized by category with phone contact integration.

## Features

- **Admin Dashboard**: Full CRUD operations for managing officials with authentication
- **Public Page**: Responsive, beautifully-styled display of officials grouped by category
- **Phone Validation**: Libphonenumber-js integration with Kenya (KE) support and E.164 normalization
- **Contact Management**: Prevent duplicate contact entries with unique database constraints
- **REST API**: Complete backend API with error handling
- **Image Upload**: Support for official photographs with Multer
- **Category Limits**: Enforced limits on officials per category
- **Access Control**: Admin panel restricted; public page cannot access admin features
- **Modern UI**: React + TypeScript + Tailwind CSS with professional gradients and animations

## Technology Stack

- **Backend**: Node.js, Express.js, PostgreSQL
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Phone Handling**: libphonenumber-js (Kenya default, E.164 storage)
- **Phone Input**: react-phone-number-input with real-time validation
- **File Handling**: Multer for image uploads
- **Styling**: Tailwind CSS with gradient backgrounds and smooth transitions

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
├── backend/                          # Node.js Express backend server
│   ├── config/
│   │   └── db.js                     # PostgreSQL connection pool configuration
│   ├── controllers/
│   │   └── officialsController.js    # API handlers for CRUD operations
│   ├── middleware/
│   │   └── upload.js                 # Multer file upload configuration
│   ├── routes/
│   │   └── officialsRoutes.js        # API route definitions
│   ├── uploads/                      # Directory for uploaded official photos
│   ├── .env                          # Environment variables (database, port, etc.)
│   ├── server.js                     # Express server entry point
│   ├── schema.sql                    # PostgreSQL table schema and indexes
│   ├── migrate.js                    # Database migration script
│   └── package.json                  # Backend dependencies
│
├── frontend/                         # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── App.tsx                   # Main app component with routing
│   │   ├── main.tsx                  # React entry point
│   │   ├── index.css                 # Global styles
│   │   ├── pages/
│   │   │   ├── Official.tsx          # Public officials display page
│   │   │   └── Admin.tsx             # Admin dashboard (CRUD operations)
│   │   ├── context/
│   │   │   └── AdminContext.tsx      # Authentication state management
│   │   └── utils/
│   │       └── api.ts                # API endpoint configuration
│   ├── dist/                         # Built production files
│   ├── index.html                    # HTML entry point
│   ├── package.json                  # Frontend dependencies
│   ├── vite.config.ts                # Vite build configuration
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── tailwind.config.cjs           # Tailwind CSS configuration
│   └── postcss.config.cjs            # PostCSS configuration
│
├── docs/
│   └── architecture.md               # System architecture documentation
│
├── .env.example                      # Example environment variables
├── integration-test.js               # Integration test script
├── MIGRATION.md                      # Database migration notes
└── README.md                         # This file
```

### Key Directories Explained

- **backend/config**: Database connection setup with SSL support for remote/local PostgreSQL
- **backend/controllers**: Business logic for managing officials (CRUD, validation, phone normalization)
- **backend/middleware**: File upload handling with size/type validation
- **backend/routes**: REST API endpoints (`GET`, `POST`, `PUT`, `DELETE`)
- **frontend/src/pages**: React pages (Official public display, Admin management panel)
- **frontend/src/context**: React Context API for authentication state and session persistence
- **frontend/src/utils**: API client configuration for communicating with backend

---

## Installation & Setup

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

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 4: Configure Environment Variables

**Backend (.env)**

Copy or create `backend/.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (PostgreSQL)
# For local development (SSL disabled):
DB_HOST=localhost
DB_PORT=5432
DB_NAME=officials_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL_REQUIRE=false

# For remote database (e.g., Aiven, AWS RDS - SSL enabled):
# DB_HOST=your-remote-host.cloud
# DB_PORT=12637
# DB_NAME=defaultdb
# DB_USER=avnadmin
# DB_PASSWORD=your_password
# DB_SSL_REQUIRE=true
```

**Frontend (.env)**

Create `frontend/.env`:

```env
VITE_API_BASE=http://localhost:3000/api/officials
VITE_UPLOAD_BASE=http://localhost:3000
```

### Step 5: Set Up PostgreSQL Database

1. **Install PostgreSQL** (v13 or higher) if not already installed
2. **Create the database and tables:**

```bash
# Using psql CLI:
psql -U postgres
CREATE DATABASE officials_db;
\c officials_db
\i ../backend/schema.sql
\q
```

3. **Verify table creation:**

```sql
SELECT * FROM information_schema.tables WHERE table_name = 'officials';
```

### Step 6: Start Backend Server

```bash
cd backend
npm run dev    # Development mode with nodemon auto-reload
# OR
npm start      # Production mode
# OR
node server.js # Direct Node.js execution
```

Expected output:
```
Database initialized
Server is running on port 3000
API available at http://localhost:3000/api/officials
Connected to PostgreSQL database
```

### Step 7: Start Frontend Development Server

In a new terminal:

```bash
cd frontend
npm run dev    # Starts Vite dev server on http://localhost:5173
```

### Step 8: Build Frontend for Production

```bash
cd frontend
npm run build  # Creates optimized build in dist/
```

---

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Access:**
- Public Officials Page: `http://localhost:5173`
- Admin Panel: `http://localhost:5173` (login with password: `admin123`)

### Production Mode

1. **Build frontend:**
```bash
cd frontend
npm run build
```

2. **Start backend (serves frontend static files):**
```bash
cd backend
npm start
```

3. **Access:** `http://localhost:3000`

---

## API Endpoints

All endpoints require the backend to be running at `http://localhost:3000`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/officials` | Get all officials |
| `GET` | `/api/officials/:id` | Get official by ID |
| `POST` | `/api/officials` | Create new official (requires photo upload) |
| `PUT` | `/api/officials/:id` | Update official (optional photo) |
| `DELETE` | `/api/officials/:id` | Delete official |

**Example GET request:**
```bash
curl http://localhost:3000/api/officials
```

**Example POST request:**
```bash
curl -X POST http://localhost:3000/api/officials \
  -F "name=John Doe" \
  -F "category=Executive" \
  -F "position=Chairperson" \
  -F "contact=+254712345678" \
  -F "photo=@/path/to/photo.jpg"
```

---

## Authentication

The application uses simple password-based admin authentication:

- **Admin Password**: `admin123` (configured in `frontend/src/context/AdminContext.tsx`)
- **Session Storage**: Stored in browser localStorage
- **Access Control**: Non-admin users cannot access `/admin` routes

### Changing Admin Password

Edit `frontend/src/pages/Admin.tsx` or add password to environment variables:

```typescript
// In handleAdminLogin function
if (adminPassword.trim() === 'admin123') {
  // Change 'admin123' to your desired password
}
```

---

## Database Schema

### officials table

```sql
CREATE TABLE officials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    position VARCHAR(100),
    contact VARCHAR(100) UNIQUE,
    photo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unique index on contact (allows NULL values)
CREATE UNIQUE INDEX idx_officials_contact_unique 
ON officials(contact) WHERE contact IS NOT NULL;
```

### Category Limits

Each category has a maximum number of officials:

- **Executive**: 6 members
- **Jumuia**: 2 members
- **Bible**: 2 members
- **Rosary**: 2 members
- **Pamphlet**: 2 members
- **Project**: 2 members
- **Liturgist**: 2 members
- **Choir**: 2 members
- **Catechist**: 1 member

---

## Phone Number Handling

- **Library**: libphonenumber-js
- **Default Country**: Kenya (KE)
- **Storage Format**: E.164 (e.g., +254712345678)
- **Validation**: 7-15 digits required
- **Duplicate Prevention**: Unique constraint on contact field

**Valid Examples:**
- `0712345678` → `+254712345678`
- `+254712345678` → `+254712345678`
- `712345678` → `+254712345678`

---

## Troubleshooting

### Database Connection Errors

**Error**: `SELF_SIGNED_CERT_IN_CHAIN` or SSL errors

**Solution**: Check `backend/.env`:
- For local DB: Set `DB_SSL_REQUIRE=false`
- For remote DB: Set `DB_SSL_REQUIRE=true` and ensure certificate is valid

### Officials Not Loading

**Check**:
1. Backend server is running: `http://localhost:3000/api/officials`
2. Frontend API URL matches backend: `VITE_API_BASE` in `frontend/.env`
3. Database has officials table with `contact` column

### Port Already in Use

Change port in `backend/.env`:
```env
PORT=3001  # or any available port
```

Then update `frontend/.env`:
```env
VITE_API_BASE=http://localhost:3001/api/officials
```

---

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add your feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Open a Pull Request

---

## License

This project is licensed under the MIT License — see LICENSE file for details.

---

## Support

For issues, questions, or suggestions, please open an issue in the repository or contact the development team.



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

- **Email**: kimanijohn1236@gmail.com
- **GitHub Issues**: Report bugs and feature requests

---

## Acknowledgments

- Built with Node.js and Express
- Database powered by PostgreSQL
- Frontend uses vanilla JavaScript and CSS
"# jkcsa" 
