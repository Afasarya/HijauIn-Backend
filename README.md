<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# 🌱 HijauIn Backend API

Backend API untuk aplikasi HijauIn - Platform manajemen lokasi sampah berbasis NestJS, Prisma, dan PostgreSQL.

## 📋 Daftar Isi

- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Prasyarat](#prasyarat)
- [Instalasi & Setup](#instalasi--setup)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)

## 🛠 Teknologi yang Digunakan

- **Framework**: NestJS 11
- **Database**: PostgreSQL
- **ORM**: Prisma 6
- **Authentication**: JWT (JSON Web Token)
- **Validation**: class-validator & class-transformer
- **Email Service**: Resend API
- **Language**: TypeScript

## 📦 Prasyarat

Sebelum memulai, pastikan sudah terinstall:

- [Node.js](https://nodejs.org/) (v18 atau lebih baru)
- [PostgreSQL](https://www.postgresql.org/download/) (v12 atau lebih baru)
- [npm](https://www.npmjs.com/) atau [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)

## 🚀 Instalasi & Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd hijauin-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database PostgreSQL

**Buat database baru:**

```bash
# Login ke PostgreSQL
psql -U postgres

# Buat database baru
CREATE DATABASE hijauin;

# Keluar dari psql
\q
```

### 4. Setup Environment Variables

Buat file `.env` di root project:

```bash
# Copy dari .env.example (jika ada) atau buat manual
cp .env.example .env
```

Isi file `.env` dengan konfigurasi berikut:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/hijauin?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Resend API Configuration (untuk email reset password)
RESEND_API_KEY="your-resend-api-key"
RESET_PASSWORD_URL="http://localhost:3000/reset-password?token="
RESEND_FROM="HijauIn <onboarding@resend.dev>"

# Server Port (optional, default: 3000)
PORT=3000
```

**⚠️ PENTING:** Ganti `YOUR_PASSWORD` dengan password PostgreSQL Anda!

### 5. Generate Prisma Client

```bash
npm run prisma:generate
```

### 6. Jalankan Database Migration

```bash
npx prisma migrate deploy
```

Atau jika ingin membuat migration baru (development):

```bash
npx prisma migrate dev
```

### 7. Seed Database (Opsional)

Jalankan seeder untuk membuat data awal (admin, users, dan lokasi sampah):

```bash
npm run db:seed
```

**Data yang akan dibuat:**

| Role  | Email                | Username  | Password  |
| ----- | -------------------- | --------- | --------- |
| ADMIN | admin@hijauin.com    | admin     | admin123  |
| USER  | coderea9@gmail.com   | aryafath  | arya123   |
| USER  | user@hijauin.com     | testuser  | user123   |

Plus 5 lokasi sampah sample di area Purwokerto.

## 🏃‍♂️ Menjalankan Aplikasi

### Development Mode (dengan auto-reload)

```bash
npm run start:dev
```

Server akan berjalan di: `http://localhost:3000`

### Production Mode

```bash
# Build project
npm run build

# Jalankan production
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000
```

### Authentication Endpoints

| Method | Endpoint              | Description           | Auth Required |
| ------ | --------------------- | --------------------- | ------------- |
| POST   | /auth/register        | Register user baru    | No            |
| POST   | /auth/login           | Login user            | No            |
| GET    | /auth/profile         | Get user profile      | Yes (JWT)     |
| POST   | /auth/forgot-password | Request reset password| No            |
| POST   | /auth/reset-password  | Reset password        | No            |

### Users Endpoints (Profile)

| Method | Endpoint  | Description              | Auth Required |
| ------ | --------- | ------------------------ | ------------- |
| GET    | /users/me | Get my profile           | Yes (JWT)     |
| PATCH  | /users/me | Update my profile        | Yes (JWT)     |

### Users Endpoints (Admin Only)

| Method | Endpoint         | Description              | Auth Required  |
| ------ | ---------------- | ------------------------ | -------------- |
| GET    | /users           | Get all users            | Yes (ADMIN)    |
| GET    | /users/stats     | Get user statistics      | Yes (ADMIN)    |
| GET    | /users/:id       | Get user by ID           | Yes (ADMIN)    |
| POST   | /users           | Create new user          | Yes (ADMIN)    |
| PATCH  | /users/:id       | Update user              | Yes (ADMIN)    |
| PATCH  | /users/:id/role  | Update user role         | Yes (ADMIN)    |
| DELETE | /users/:id       | Delete user              | Yes (ADMIN)    |

### Waste Locations Endpoints (Admin)

| Method | Endpoint                | Description                  | Auth Required |
| ------ | ----------------------- | ---------------------------- | ------------- |
| POST   | /waste-locations        | Create waste location        | Yes (ADMIN)   |
| GET    | /waste-locations        | Get all locations (admin)    | Yes (ADMIN)   |
| GET    | /waste-locations/:id    | Get location by ID           | Yes (ADMIN)   |
| PATCH  | /waste-locations/:id    | Update location              | Yes (ADMIN)   |
| DELETE | /waste-locations/:id    | Delete location              | Yes (ADMIN)   |

### Waste Locations Endpoints (Public)

| Method | Endpoint      | Description                      | Auth Required |
| ------ | ------------- | -------------------------------- | ------------- |
| GET    | /loka         | Get all waste locations (public) | No            |
| GET    | /loka/nearby  | Find nearby waste locations      | No            |

### Example Request: Login

```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "emailOrUsername": "admin@hijauin.com",
  "password": "admin123"
}
```

**Response:**

```json
{
  "message": "Login success",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@hijauin.com",
    "username": "admin",
    "nama_panggilan": "Admin",
    "role": "ADMIN"
  }
}
```

### Example Request: Create Waste Location (Admin)

```bash
POST http://localhost:3000/waste-locations
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "name": "Tong Sampah Depan Gedung A",
  "description": "Tong sampah untuk organik dan anorganik",
  "address": "Gedung A, Kampus UMP",
  "latitude": -7.4291,
  "longitude": 109.2320,
  "categories": ["ORGANIK", "ANORGANIK"],
  "image_url": "https://example.com/image.jpg"
}
```

### Example Request: Find Nearby Waste Locations

```bash
GET http://localhost:3000/loka/nearby?lat=-7.4291&lng=109.2320&radius=1000&categories=ORGANIK
```

## 🧪 Testing

### Run Unit Tests

```bash
npm run test
```

### Run E2E Tests

```bash
npm run test:e2e
```

### Run Test Coverage

```bash
npm run test:cov
```

## 🔍 Database Management

### View Database dengan Prisma Studio

```bash
npx prisma studio
```

Akan membuka UI di: `http://localhost:5555`

### Reset Database (⚠️ HATI-HATI!)

```bash
# Drop semua data dan jalankan ulang migration
npx prisma migrate reset

# Atau manual:
npx prisma migrate reset --force
npm run db:seed
```

## 📝 Scripts yang Tersedia

| Script                | Description                          |
| --------------------- | ------------------------------------ |
| `npm run start`       | Start aplikasi (production mode)     |
| `npm run start:dev`   | Start dengan auto-reload (dev mode)  |
| `npm run start:debug` | Start dengan debugger                |
| `npm run build`       | Build aplikasi untuk production      |
| `npm run lint`        | Run ESLint untuk check code quality  |
| `npm run format`      | Format code dengan Prettier          |
| `npm run test`        | Run unit tests                       |
| `npm run test:e2e`    | Run end-to-end tests                 |
| `npm run test:cov`    | Run tests dengan coverage report     |
| `npm run prisma:generate` | Generate Prisma Client           |
| `npm run prisma:migrate`  | Deploy database migrations       |
| `npm run db:seed`     | Seed database dengan data awal       |

## 🚢 Deployment

### Render.com

1. Push code ke GitHub
2. Connect repository di Render.com
3. Setup environment variables di Render dashboard
4. Deploy akan otomatis menggunakan script: `npm run render:build`

### Manual Deployment

```bash
# Build aplikasi
npm run build

# Jalankan migration
npm run prisma:migrate

# Start production server
npm run start:prod
```

## 🔧 Troubleshooting

### Error: "Can't reach database server"

**Solusi:**
- Pastikan PostgreSQL sudah running
- Check DATABASE_URL di file `.env`
- Test koneksi: `psql -U postgres -d hijauin`

### Error: "Cannot find module '@prisma/client'"

**Solusi:**
```bash
npm run prisma:generate
```

### Error: "Prisma schema loading error"

**Solusi:**
```bash
npm install
npm run prisma:generate
```

### Port 3000 sudah digunakan

**Solusi:**
- Ubah PORT di `.env`: `PORT=3001`
- Atau stop aplikasi yang menggunakan port 3000

## 📞 Support

Jika ada pertanyaan atau masalah:

- Email: coderea9@gmail.com
- Author: Arya Fathdillah

## 📄 License

Private & Proprietary - © 2024 HijauIn

---

**Built with ❤️ using NestJS + Prisma + PostgreSQL**
