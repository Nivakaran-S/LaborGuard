# LaborGuard Authentication Service

Authentication and Identity Service for the LaborGuard platform. This microservice handles user registration, login, profile management, and role-based access control.

## Features

- **User Registration**: Create accounts for workers, legal officers, and admins.
- **Authentication**: Secure login using JWT (Access & Refresh Tokens).
- **Role-Based Access Control (RBAC)**: Protect routes based on user roles.
- **Profile Management**: View and update user profiles.
- **Security**: Password hashing (bcrypt), rate limiting, helmet security headers.
- **Verification**: Email and SMS verification support (Phase 2).

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JSON Web Tokens (JWT)
- **Validation**: express-validator
- **Testing**: Jest, Supertest

## Project Structure

```
auth-service/
├── src/
│   ├── config/         # Database and JWT configuration
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth, validation, error handling middleware
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic
│   ├── utils/          # Helper functions
│   ├── tests/          # Unit and integration tests
│   ├── app.js          # Express app setup
│   └── server.js       # Entry point
├── .env                # Environment variables
└── package.json        # Dependencies
```

## Installation & Setup

### Prerequisites

- Node.js (v14+)
- MongoDB (running locally or cloud URI)

### Steps

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd auth-service
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.env` file in the root directory based on the example below:
    ```env
    PORT=5001
    NODE_ENV=development
    MONGODB_URI=mongodb://localhost:27017/laborguard-auth
    JWT_ACCESS_SECRET=your_super_secret_access_key
    JWT_REFRESH_SECRET=your_super_secret_refresh_key
    JWT_ACCESS_EXPIRY=15m
    JWT_REFRESH_EXPIRY=7d
    FRONTEND_URL=http://localhost:3000
    ```

4.  **Start the server:**
    ```bash
    npm run dev
    ```

## API Endpoints

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/verify` | Verify email/phone OTP | No |
| GET | `/api/users/me` | Get current user profile | Yes |
| PUT | `/api/users/me` | Update user profile | Yes |

## Testing

Run the test suite using Jest:

```bash
npm test
```

For integration tests, ensure a local MongoDB instance is running.

## Deployment

This service is ready for deployment on platforms like Render or Railway.
Ensure you set the environment variables in your deployment dashboard.

## Contributors

- LaborGuard Team (SE3040)
