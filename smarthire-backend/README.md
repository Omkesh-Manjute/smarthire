# VerifyHire Backend API

Node.js/Express backend for VerifyHire - Candidate Verification Platform.

## Features

- 🔐 JWT Authentication
- 📊 Candidate Management
- 🔍 Verification Workflow
- 📧 Email Integration (ready)
- ☁️ Cloud Storage (ready)
- 🛡️ Security (Helmet, Rate Limiting, CORS)
- 📝 Request Validation
- 🧪 Test Ready

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcryptjs
- **File Upload:** Multer + Cloudinary
- **Email:** Nodemailer
- **Security:** Helmet, express-rate-limit
- **Validation:** express-validator

## Quick Start

### 1. Install Dependencies

```bash
cd verifyhire-backend
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Start MongoDB

```bash
# Make sure MongoDB is running locally
# OR use MongoDB Atlas cloud database
```

### 4. Run Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server runs at: `http://localhost:5000`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new recruiter |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/logout` | Logout |

### Candidates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/candidates` | Get all candidates |
| POST | `/api/candidates` | Create candidate |
| GET | `/api/candidates/:id` | Get single candidate |
| PUT | `/api/candidates/:id` | Update candidate |
| DELETE | `/api/candidates/:id` | Delete candidate |
| GET | `/api/candidates/:id/score` | Get trust score breakdown |
| GET | `/api/candidates/stats/overview` | Dashboard stats |

### Verification
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/verification/send-link` | Send verification email |
| GET | `/api/verification/validate-token` | Validate token |
| POST | `/api/verification/start` | Start verification |
| POST | `/api/verification/submit-check` | Submit check (GPS, selfie, etc.) |
| POST | `/api/verification/complete` | Complete verification |
| GET | `/api/verification/status/:token` | Get status |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/dashboard` | Get dashboard data |

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/verifyhire
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email
EMAIL_PASS=your-password
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
FRONTEND_URL=http://localhost:5173
```

## Database Models

### User
- name, email, password
- role (recruiter/admin)
- company
- lastLogin

### Candidate
- name, email, phone
- role, experience, skills
- location (city, state, coordinates)
- trustScore, status
- verification checks
- documents, selfie, video
- fraudFlags

## Response Format

All API responses follow this structure:

```json
{
  "success": true/false,
  "message": "Description",
  "data": { ... }
}
```

## Authentication

Include JWT token in Authorization header:

```
Authorization: Bearer <your-token>
```

## Error Handling

Errors return appropriate status codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Security Features

- Helmet.js for security headers
- Rate limiting (100 requests per 15 min)
- CORS configured for frontend
- Password hashing with bcrypt
- JWT token authentication
- Input validation & sanitization

## Deployment

### Heroku
```bash
git init
git add .
git commit -m "Initial commit"
heroku create verifyhire-api
heroku config:set MONGODB_URI=your-db-uri
heroku config:set JWT_SECRET=your-secret
git push heroku main
```

### Railway/Render
1. Connect GitHub repo
2. Add environment variables
3. Deploy automatically

## Development

### Run Tests
```bash
npm test
```

### Code Structure
```
verifyhire-backend/
├── config/         # Configuration files
├── middleware/     # Auth, validation
├── models/         # MongoDB models
├── routes/         # API routes
├── utils/          # Helper functions
├── server.js       # Entry point
└── .env.example    # Environment template
```

## Frontend Integration

The React frontend connects to this API. Update the frontend `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## License

MIT
