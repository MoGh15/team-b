# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Use JWT tokens received from the login endpoint. Include in headers:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Admin Login
**POST /auth/login**

Authenticate an admin and receive a JWT token.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "507f1f77bcf86cd799439011",
    "email": "admin@example.com",
    "role": "Admin"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Please provide email and password"
}
```

---

### 2. Admin Registration
**POST /auth/register**

Create a new admin account. (Note: In production, this should be restricted)

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Admin registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "507f1f77bcf86cd799439011",
    "email": "admin@example.com",
    "role": "Admin"
  }
}
```

**Error Response (400) - Email already exists:**
```json
{
  "success": false,
  "message": "Admin already exists with this email"
}
```

**Error Response (400) - Missing fields:**
```json
{
  "success": false,
  "message": "Please provide email and password"
}
```

---

### 3. Get Current Admin (Protected)
**GET /auth/me**

Retrieve the current authenticated admin's information.

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "admin": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "admin@example.com",
    "role": "Admin",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (401) - No token:**
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

**Error Response (401) - Invalid token:**
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

---

### 4. Health Check
**GET /health**

Check if the server is running.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Server is running"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (authentication error) |
| 404 | Not Found |
| 500 | Server Error |

---

## Usage Examples

### Login Flow

1. **Send login request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@123"
  }'
```

2. **Get token from response and use it:**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Validation Rules

### Email
- Must be a valid email format
- Must be unique (for registration)
- Case-insensitive

### Password
- Minimum 6 characters
- Will be hashed before storage
- Should be strong (contain uppercase, lowercase, numbers for security)

### Role
- Only "Admin" is currently available
- Automatically assigned during registration

---

## Rate Limiting (Future)
Coming soon! This will help prevent brute force attacks on the login endpoint.

---

## CORS
The API is CORS-enabled to allow requests from:
- Frontend applications
- Different domains
- Browsers

---

## Response Format
All responses follow this format:

```json
{
  "success": true/false,
  "message": "Human readable message",
  "data": "Optional data object/array",
  "error": "Optional error details (development only)"
}
```

