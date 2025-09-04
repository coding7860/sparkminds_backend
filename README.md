# SparkMinds Backend API

A Node.js/Express backend API for the SparkMinds educational platform with role-based authentication (Admin, Mentor, Trainee).

## Features

- 🔐 JWT-based authentication
- 👥 Role-based access control (Admin, Mentor, Trainee)
- 🛡️ Secure password hashing with bcrypt
- ✅ Input validation and sanitization
- 🚀 RESTful API endpoints
- 🗄️ MySQL database integration
- 🔒 Security middleware (Helmet, CORS)
- 📝 Request logging

## Prerequisites

- Node.js (v14 or higher)
- MySQL database
- npm or yarn package manager

## Installation

1. **Clone the repository and navigate to backend directory:**
   ```bash
   cd sparkminds_backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp env.example .env
   ```

4. **Configure environment variables in `.env`:**
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=sparkminds_db
   DB_USER=your_username
   DB_PASSWORD=your_password

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=24h

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   ```

## Database Setup

### Required Users Table Structure

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'mentor', 'trainee') NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Sample Data (Optional)

```sql
-- Insert sample admin user (password: admin123)
INSERT INTO users (email, password, role, first_name, last_name) VALUES 
('admin@sparkminds.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/5Qq8K8i', 'admin', 'Admin', 'User');

-- Insert sample mentor user (password: mentor123)
INSERT INTO users (email, password, role, first_name, last_name) VALUES 
('mentor@sparkminds.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/5Qq8K8i', 'mentor', 'Mentor', 'User');

-- Insert sample trainee user (password: trainee123)
INSERT INTO users (email, password, role, first_name, last_name) VALUES 
('trainee@sparkminds.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/5Qq8K8i', 'trainee', 'Trainee', 'User');
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on the configured port (default: 5000).

## API Endpoints

### Login Routes

#### POST `/api/login/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "admin",
      "first_name": "Admin",
      "last_name": "User",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST `/api/login/register`
Register a new user (optional).

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "role": "trainee",
  "first_name": "New",
  "last_name": "User"
}
```

#### GET `/api/login/profile`
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

#### POST `/api/login/logout`
Logout (client-side token removal).

### Health Check

#### GET `/health`
Check server status.

## Authentication

### JWT Token Usage

Include the JWT token in the Authorization header for protected routes:

```
Authorization: Bearer <your_jwt_token>
```

### Role-Based Access Control

The API includes middleware for role-based access:

- `isAdmin` - Only admin users
- `isMentor` - Only mentor users  
- `isTrainee` - Only trainee users
- `isAdminOrMentor` - Admin or mentor users

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token expiration
- Input validation and sanitization
- CORS protection
- Helmet security headers
- SQL injection prevention with parameterized queries

## Project Structure

```
sparkminds_backend/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   └── auth.js             # Authentication middleware
├── models/
│   └── User.js             # User model and database operations
├── routes/
│   └── login.js             # Login routes
├── .env                     # Environment variables
├── env.example             # Environment variables template
├── package.json            # Dependencies and scripts
├── README.md               # This file
└── server.js               # Main server file
```

## Testing the API

### Using cURL

**Login:**
```bash
curl -X POST http://localhost:5000/api/login/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sparkminds.com","password":"admin123"}'
```

**Get Profile (with token):**
```bash
curl -X GET http://localhost:5000/api/login/profile \
  -H "Authorization: Bearer <your_jwt_token>"
```

### Using Postman

1. Import the endpoints
2. Set the base URL to `http://localhost:5000`
3. Use the login endpoint to get a token
4. Include the token in the Authorization header for protected routes

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database credentials in `.env`
   - Ensure MySQL service is running
   - Verify database and table exist

2. **JWT Token Invalid**
   - Check JWT_SECRET in `.env`
   - Ensure token hasn't expired
   - Verify token format in Authorization header

3. **CORS Issues**
   - Check CORS_ORIGIN in `.env`
   - Ensure frontend URL matches

### Logs

Check console output for detailed error messages and request logs.

## Contributing

1. Follow the existing code style
2. Add proper error handling
3. Include input validation
4. Test all endpoints
5. Update documentation

## License

MIT License
