# Clinic Health Form System - Backend

Backend API for the Clinic Health Form System built with Node.js, Express, and MongoDB.

## 📋 Prerequisites

- Node.js (v16+)
- Docker & Docker Compose
- npm or yarn

## 🚀 Quick Start

### 1. Start MongoDB with Docker

From the root directory (where `docker-compose.yml` is located), run:

```bash
docker-compose up -d
```

This will:
- Start MongoDB in a Docker container named `patient-forms-mongo`
- Expose MongoDB on `localhost:27017`
- Create a persistent volume for data

### 2. Install Dependencies

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

### 3. Seed Admin User

Create the default admin user in the database:

```bash
npm run seed
```

**Default Admin Credentials:**
- Email: `admin@example.com`
- Password: `admin123`

⚠️ **Note:** Change these credentials in production!

### 4. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:3000`

## 🏗️ Project Structure

```
backend/
├── controllers/
│   └── authController.js      # Authentication logic
├── middleware/
│   └── auth.js                # JWT verification & authorization
├── routes/
│   └── auth.js                # Authentication routes
├── config/
│   └── db.js                  # MongoDB connection configuration
├── models/
│   └── User.js                # User schema with Admin role
├── seeds/
│   └── adminSeed.js           # Admin user seeding script
├── .env                       # Environment variables
├── .gitignore                 # Git ignore rules
├── package.json               # Project dependencies
└── server.js                  # Main server file
```

## 📝 Environment Variables

The `.env` file contains:

```
PORT=3000                                                              # Server port
MONGO_URI=mongodb://admin:admin@localhost:27017/...                  # MongoDB connection string
JWT_SECRET=your_jwt_secret_key_change_in_production                 # JWT secret for authentication
```

## ⚙️ Configuration

### User Schema

The User model includes:
- **email**: Required, unique, validated email address
- **password**: Required, minimum 6 characters, hashed with bcrypt
- **role**: Fixed to "Admin" role only
- **timestamps**: Automatically tracks createdAt and updatedAt

### Password Security

Passwords are automatically hashed using bcrypt before saving to the database. The schema includes a `comparePassword()` method for authentication.

## 📚 API Endpoints

### Health Check

```
GET /api/health
```

Returns server status and timestamp.

### Authentication Endpoints

#### Login

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "role": "Admin"
  }
}
```

#### Get Current User

```
GET /api/auth/me
Authorization: Bearer <token>
```

Returns the authenticated user's information. Requires valid JWT token in Authorization header.

## 🔄 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Run server in production mode |
| `npm run dev` | Run server in development mode with nodemon |
| `npm run seed` | Seed the database with default admin user |

## 🛑 Stopping Services

To stop MongoDB:

```bash
docker-compose down
```

To remove the persistent volume (warning: deletes data):

```bash
docker-compose down -v
```

## 📦 Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **dotenv**: Environment variable management

## 🤝 Next Steps

1. ✅ Implement authentication routes (login, register, logout) - **DONE**
2. ✅ Add middleware for JWT verification - **DONE**
3. Create patient form routes and schema
4. Implement admin dashboard routes
5. Add input validation middleware
6. Set up React frontend

## ✅ Production Checklist

- [ ] Change JWT_SECRET to a strong random value
- [ ] Update MONGO_URI with production database
- [ ] Configure CORS settings
- [ ] Enable HTTPS
- [ ] Set up proper logging
- [ ] Configure rate limiting
- [ ] Add input validation
- [ ] Set up monitoring and alerts

## 📞 Support

For issues or questions, please refer to the main README.md in the root directory.
