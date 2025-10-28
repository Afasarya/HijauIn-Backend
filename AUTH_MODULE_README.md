# Auth Module - HijauIn Backend

Module authentication lengkap dengan fitur register dan login menggunakan JWT.

## Fitur

- ✅ Register user baru dengan validasi
- ✅ Login dengan email atau username
- ✅ JWT token generation otomatis
- ✅ Password hashing dengan bcryptjs
- ✅ JWT Strategy dan Guard untuk protected routes
- ✅ Validasi menggunakan class-validator
- ✅ Environment variables dengan ConfigModule

## Teknologi

- NestJS
- Prisma ORM (PostgreSQL)
- JWT (JSON Web Token)
- bcryptjs
- Passport.js
- class-validator

## Environment Variables

Pastikan file `.env` berisi:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/hijauin?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
```

## Instalasi

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

## API Endpoints

### 1. Register (POST /auth/register)

Mendaftarkan user baru.

**Request Body:**
```json
{
  "nama_panggilan": "John",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "nama_panggilan": "John",
    "username": "johndoe",
    "email": "john@example.com",
    "createdAt": "2025-10-28T10:30:00.000Z"
  }
}
```

**Validasi:**
- `nama_panggilan`: Required, string
- `username`: Required, min 3 karakter
- `email`: Required, format email valid
- `password`: Required, min 6 karakter
- `confirmPassword`: Harus sama dengan password

**Error Response:**
- 400: Password tidak match
- 409: Email atau username sudah terdaftar

### 2. Login (POST /auth/login)

Login dengan email atau username.

**Request Body:**
```json
{
  "emailOrUsername": "johndoe",
  "password": "password123"
}
```

atau

```json
{
  "emailOrUsername": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login success",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response:**
- 401: Credentials tidak valid

### 3. Get Profile (GET /auth/profile)

Mendapatkan profile user yang sedang login. **Protected route** - memerlukan JWT token.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "message": "Profile retrieved successfully",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "username": "johndoe",
    "nama_panggilan": "John"
  }
}
```

**Error Response:**
- 401: Token tidak valid atau tidak ada

## Cara Protect Route Lain

Untuk melindungi route lain dengan JWT authentication:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Controller('protected')
export class ProtectedController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getProtectedData(@Request() req) {
    // req.user berisi data user yang sedang login
    return {
      message: 'This is protected data',
      user: req.user
    };
  }
}
```

## Testing dengan cURL

### Register
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nama_panggilan": "John",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "johndoe",
    "password": "password123"
  }'
```

### Get Profile (dengan token)
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## Testing dengan Postman/Thunder Client

1. **Register**: POST `http://localhost:3000/auth/register`
   - Body: JSON dengan fields yang diperlukan

2. **Login**: POST `http://localhost:3000/auth/login`
   - Body: JSON dengan emailOrUsername dan password
   - Copy `access_token` dari response

3. **Get Profile**: GET `http://localhost:3000/auth/profile`
   - Headers: `Authorization: Bearer <paste_access_token_here>`

## Struktur Folder

```
src/
├── auth/
│   ├── dto/
│   │   ├── register.dto.ts      # DTO untuk register
│   │   ├── login.dto.ts         # DTO untuk login
│   │   └── index.ts             # Barrel exports
│   ├── guards/
│   │   └── jwt-auth.guard.ts    # Guard untuk protect routes
│   ├── strategies/
│   │   └── jwt.strategy.ts      # JWT validation strategy
│   ├── auth.controller.ts       # API endpoints
│   ├── auth.service.ts          # Business logic
│   └── auth.module.ts           # Module configuration
└── prisma/
    ├── prisma.service.ts        # Prisma service
    └── prisma.module.ts         # Prisma module (global)
```

## Security Features

- ✅ Password di-hash dengan bcryptjs (salt rounds: 10)
- ✅ JWT token dengan expiration time
- ✅ Secret key dari environment variables
- ✅ Validation pada semua input
- ✅ Unique constraint pada email dan username
- ✅ Password tidak pernah di-return ke client

## Catatan Penting

1. **Ganti JWT_SECRET di production** dengan secret key yang kuat
2. **Validasi email** bisa ditambahkan dengan email verification
3. **Refresh token** bisa diimplementasikan untuk keamanan lebih baik
4. **Rate limiting** disarankan untuk mencegah brute force attacks
5. **HTTPS** wajib digunakan di production

## Database Schema

```prisma
model User {
  id            String   @id @default(uuid())
  nama_panggilan String
  username      String   @unique
  email         String   @unique
  password      String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("users")
}
```

## Troubleshooting

### Error: JWT_SECRET not defined
- Pastikan file `.env` ada dan berisi `JWT_SECRET`
- Restart development server

### Error: Database connection failed
- Pastikan PostgreSQL running
- Cek `DATABASE_URL` di `.env`
- Jalankan `npx prisma migrate dev`

### Error: Property 'user' does not exist
- Jalankan `npx prisma generate` untuk generate Prisma Client
