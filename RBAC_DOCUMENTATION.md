# 🔐 Role-Based Access Control (RBAC) - Documentation

## ✅ Implementasi Lengkap

Sistem RBAC enterprise-ready telah berhasil diimplementasikan dengan arsitektur yang scalable dan modular.

## 🎯 Fitur RBAC

### 1. **User Roles (Enum-based)**
```typescript
enum UserRole {
  USER = 'USER',           // Default role untuk register
  ADMIN = 'ADMIN',         // Akses admin dashboard & management
  SUPERADMIN = 'SUPERADMIN' // Full control + role management
}
```

### 2. **Role Assignment**
- **Register**: Default role = `USER` (otomatis)
- **Admin/Superadmin**: Dibuat via seeding atau endpoint khusus
- **Role Change**: Hanya SUPERADMIN yang bisa mengubah role user lain

### 3. **JWT Payload dengan Role**
```typescript
interface JwtPayload {
  sub: string;        // User ID
  email: string;      // User email
  username: string;   // Username
  role: UserRole;     // ✅ User role
}
```

### 4. **Custom Decorators**

#### @Roles(...roles)
Decorator untuk menentukan role yang diperbolehkan mengakses endpoint.
```typescript
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
```

#### @GetUser(field?)
Decorator untuk mendapatkan user dari JWT token.
```typescript
@GetUser() user            // Get full user object
@GetUser('id') userId      // Get specific field
@GetUser('role') userRole  // Get user role
```

### 5. **Guards**

#### JwtAuthGuard
Memverifikasi JWT token valid.

#### RolesGuard
Memverifikasi user memiliki role yang sesuai dengan yang ditentukan di decorator `@Roles()`.

## 📁 Struktur File

```
src/
├── auth/
│   ├── decorators/
│   │   ├── roles.decorator.ts      ✅ @Roles() decorator
│   │   └── get-user.decorator.ts   ✅ @GetUser() decorator
│   ├── enums/
│   │   └── user-role.enum.ts       ✅ UserRole enum
│   ├── guards/
│   │   ├── jwt-auth.guard.ts       ✅ JWT verification
│   │   └── roles.guard.ts          ✅ Role-based access control
│   ├── strategies/
│   │   └── jwt.strategy.ts         ✅ JWT strategy (dengan role)
│   ├── auth.service.ts             ✅ Register & Login (dengan role)
│   ├── auth.controller.ts          ✅ Auth endpoints
│   └── auth.module.ts
└── users/
    ├── dto/
    │   └── update-role.dto.ts      ✅ DTO untuk update role
    ├── users.service.ts            ✅ User management logic
    ├── users.controller.ts         ✅ Protected endpoints
    └── users.module.ts
```

## 🚀 API Endpoints

### Public Endpoints (No Auth Required)

#### 1. Register User
```http
POST /auth/register
Content-Type: application/json

{
  "nama_panggilan": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "nama_panggilan": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "USER",
    "createdAt": "2025-10-29T..."
  }
}
```

#### 2. Login
```http
POST /auth/login
Content-Type: application/json

{
  "emailOrUsername": "johndoe",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login success",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "username": "johndoe",
    "nama_panggilan": "John Doe",
    "role": "USER"
  }
}
```

### Protected Endpoints (Require JWT)

#### 3. Get Profile (All Authenticated Users)
```http
GET /auth/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Profile retrieved successfully",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "username": "johndoe",
    "nama_panggilan": "John Doe",
    "role": "USER"
  }
}
```

#### 4. Admin Dashboard (ADMIN + SUPERADMIN Only)
```http
GET /auth/admin/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Welcome to admin dashboard",
  "user": {
    "id": "uuid",
    "email": "admin@hijauin.com",
    "username": "admin",
    "nama_panggilan": "Admin",
    "role": "ADMIN"
  }
}
```

### User Management Endpoints (Admin Protected)

#### 5. Get All Users (ADMIN + SUPERADMIN)
```http
GET /users
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "message": "Users retrieved successfully",
  "users": [
    {
      "id": "uuid",
      "nama_panggilan": "John Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "USER",
      "createdAt": "2025-10-29T...",
      "updatedAt": "2025-10-29T..."
    }
  ]
}
```

#### 6. Get User Statistics (ADMIN + SUPERADMIN)
```http
GET /users/stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "message": "User statistics retrieved successfully",
  "stats": {
    "totalUsers": 10,
    "usersByRole": [
      { "role": "USER", "count": 7 },
      { "role": "ADMIN", "count": 2 },
      { "role": "SUPERADMIN", "count": 1 }
    ]
  }
}
```

#### 7. Get User by ID (ADMIN + SUPERADMIN)
```http
GET /users/:id
Authorization: Bearer <admin_token>
```

#### 8. Update User Role (SUPERADMIN Only)
```http
PATCH /users/:id/role
Authorization: Bearer <superadmin_token>
Content-Type: application/json

{
  "role": "ADMIN"
}
```

**Response:**
```json
{
  "message": "User role updated successfully",
  "user": {
    "id": "uuid",
    "nama_panggilan": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "ADMIN",
    "updatedAt": "2025-10-29T..."
  }
}
```

**Note:** User tidak bisa mengubah role mereka sendiri (akan return 403 Forbidden).

#### 9. Delete User (SUPERADMIN Only)
```http
DELETE /users/:id
Authorization: Bearer <superadmin_token>
```

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

**Note:** User tidak bisa menghapus akun mereka sendiri.

## 🔑 Test Credentials

Setelah menjalankan `npm run db:seed`, gunakan credentials berikut untuk testing:

### SUPERADMIN
```
Email: superadmin@hijauin.com
Password: superadmin123
```

### ADMIN
```
Email: admin@hijauin.com
Password: admin123
```

### USER
```
Email: user@hijauin.com
Password: user123
```

## 💻 Cara Menggunakan di Controller

### Contoh 1: Endpoint untuk ADMIN dan SUPERADMIN
```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { GetUser } from './auth/decorators/get-user.decorator';
import { UserRole } from './auth/enums/user-role.enum';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Get('reports')
  async getReports(@GetUser() user: any) {
    // Hanya ADMIN dan SUPERADMIN yang bisa akses
    return {
      message: 'Reports data',
      requestedBy: user.username
    };
  }
}
```

### Contoh 2: Endpoint untuk SUPERADMIN Only
```typescript
@Controller('system')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemController {
  
  @Roles(UserRole.SUPERADMIN)
  @Post('settings')
  async updateSettings(
    @Body() settings: any,
    @GetUser('id') userId: string
  ) {
    // Hanya SUPERADMIN yang bisa akses
    return { message: 'Settings updated' };
  }
}
```

### Contoh 3: Endpoint untuk Semua Authenticated Users
```typescript
@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  
  @Get()
  async getPosts(@GetUser() user: any) {
    // Semua user yang login bisa akses
    return { posts: [], user };
  }
  
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Delete(':id')
  async deletePost(@Param('id') id: string) {
    // Hanya admin yang bisa delete
    return { message: 'Post deleted' };
  }
}
```

## 🧪 Testing Flow

### 1. Register sebagai USER
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nama_panggilan": "Test User",
    "username": "testuser123",
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### 2. Login sebagai ADMIN
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "admin@hijauin.com",
    "password": "admin123"
  }'
```
**Copy `access_token` dari response**

### 3. Akses Admin Endpoint
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 4. Coba akses dengan USER token (akan gagal 403)
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

### 5. Update Role User (Sebagai SUPERADMIN)
```bash
curl -X PATCH http://localhost:3000/users/USER_ID/role \
  -H "Authorization: Bearer YOUR_SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "ADMIN"}'
```

## 🔒 Security Features

1. ✅ **Role di JWT Payload**: Role disimpan di token, tidak perlu query database setiap request
2. ✅ **Enum-based Role**: Menghindari typo dengan TypeScript enum
3. ✅ **Metadata Decorator**: `@Roles()` menggunakan SetMetadata untuk clean code
4. ✅ **Guard Composition**: JwtAuthGuard + RolesGuard untuk double protection
5. ✅ **Self-protection**: User tidak bisa ubah role sendiri atau delete akun sendiri
6. ✅ **Database Enum**: PostgreSQL enum untuk consistency
7. ✅ **Default Role**: Auto-assign USER role saat register

## 🎨 Use Cases

### Flutter App (Mobile)
- User register dengan role `USER`
- Login dan terima JWT token dengan role
- Akses fitur-fitur user biasa
- Token berisi role untuk authorization di frontend

### Next.js Admin Dashboard (Web)
- Login dengan credentials ADMIN atau SUPERADMIN
- JWT token berisi role untuk routing guard
- Akses user management, statistics, dll
- SUPERADMIN bisa manage admin roles

## 📊 Role Hierarchy

```
SUPERADMIN (Full Access)
    ↓
  ADMIN (Management Access)
    ↓
  USER (Basic Access)
```

- **SUPERADMIN**: Semua akses + role management + delete users
- **ADMIN**: View users, statistics, admin dashboard
- **USER**: Profile, basic features

## 🚀 Deployment Checklist

- [ ] Ganti JWT_SECRET di production dengan random string yang kuat
- [ ] Set JWT_EXPIRES_IN sesuai kebutuhan (default 7d)
- [ ] Jalankan `npm run db:seed` di production untuk create superadmin
- [ ] Ubah password default superadmin setelah seed
- [ ] Enable HTTPS untuk JWT token security
- [ ] Set up rate limiting untuk login endpoint
- [ ] Monitor role changes di audit log

## 🔧 Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migration
npm run prisma:migrate

# Seed database (create test users)
npm run db:seed

# Build
npm run build

# Start development
npm run start:dev

# Start production
npm run start:prod
```

## 📝 Notes

- Role `USER` di-assign otomatis saat register
- Admin dan Superadmin harus dibuat via seeding atau manual
- RolesGuard membaca role dari JWT payload (tidak query database)
- Reflector digunakan untuk membaca metadata dari decorator @Roles()
- Multiple roles bisa di-assign ke satu endpoint: `@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)`

---

**Status**: ✅ RBAC System fully implemented and tested
**Database**: ✅ Migration applied, seed completed
**Build**: ✅ No errors
