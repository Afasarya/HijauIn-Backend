# 🔐 RBAC System - Simplified (USER & ADMIN Only)

## ✅ Sistem Role Sederhana

Sistem RBAC telah disederhanakan menjadi **2 role saja**:

```typescript
enum UserRole {
  USER = 'USER',    // Default untuk register
  ADMIN = 'ADMIN',  // Akses penuh admin dashboard
}
```

## 🎯 Permission Matrix

| Endpoint | USER | ADMIN |
|----------|------|-------|
| POST /auth/register | ✅ Public | ✅ Public |
| POST /auth/login | ✅ Public | ✅ Public |
| GET /auth/profile | ✅ | ✅ |
| GET /auth/admin/dashboard | ❌ | ✅ |
| GET /users | ❌ | ✅ |
| GET /users/stats | ❌ | ✅ |
| GET /users/:id | ❌ | ✅ |
| PATCH /users/:id/role | ❌ | ✅ |
| DELETE /users/:id | ❌ | ✅ |

## 🔑 Test Credentials

Setelah menjalankan `npm run db:seed`:

### ADMIN (Full Access)
```
Email: admin@hijauin.com
Password: admin123
```

### USER (Basic Access)
```
Email: user@hijauin.com
Password: user123
```

## 💻 Cara Menggunakan

### Endpoint untuk ADMIN Only
```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  
  @Roles(UserRole.ADMIN)
  @Get('dashboard')
  async getDashboard(@GetUser() user: any) {
    // Hanya ADMIN yang bisa akses
    return { message: 'Admin dashboard', user };
  }
}
```

### Endpoint untuk Semua Authenticated Users
```typescript
@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  
  @Get()
  async getPosts(@GetUser() user: any) {
    // USER dan ADMIN bisa akses
    return { posts: [] };
  }
}
```

### Endpoint dengan Mixed Access
```typescript
@Controller('articles')
@UseGuards(JwtAuthGuard)
export class ArticlesController {
  
  @Get()
  async getArticles() {
    // Semua authenticated users bisa akses
    return { articles: [] };
  }
  
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async deleteArticle(@Param('id') id: string) {
    // Hanya ADMIN yang bisa delete
    return { message: 'Deleted' };
  }
}
```

## 🚀 Quick Start

```bash
# 1. Generate Prisma Client
npm run prisma:generate

# 2. Run migrations
npm run prisma:migrate

# 3. Seed database (create ADMIN and USER)
npm run db:seed

# 4. Start development server
npm run start:dev
```

## 📋 API Testing Flow

### 1. Register sebagai USER (Default)
```bash
POST http://localhost:3000/auth/register
{
  "nama_panggilan": "John",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
# Response: role = "USER"
```

### 2. Login sebagai ADMIN
```bash
POST http://localhost:3000/auth/login
{
  "emailOrUsername": "admin@hijauin.com",
  "password": "admin123"
}
# Copy access_token dari response
```

### 3. Akses Admin Endpoint
```bash
GET http://localhost:3000/users
Authorization: Bearer <admin_token>
# ✅ Success - ADMIN bisa akses
```

### 4. Coba Akses dengan USER Token
```bash
GET http://localhost:3000/users
Authorization: Bearer <user_token>
# ❌ 403 Forbidden - USER tidak bisa akses endpoint admin
```

### 5. Update Role User menjadi ADMIN
```bash
PATCH http://localhost:3000/users/:userId/role
Authorization: Bearer <admin_token>
{
  "role": "ADMIN"
}
# ✅ Admin bisa promote USER menjadi ADMIN
```

## 🎨 Use Cases

### Flutter App (Mobile)
- User register otomatis dapat role `USER`
- Login dapat JWT token dengan role di payload
- Frontend check role dari token untuk UI logic
- User hanya bisa akses fitur basic (profile, posts, dll)

### Next.js Admin Dashboard (Web)
- Login dengan credentials ADMIN
- JWT token berisi role `ADMIN`
- Routing guard di Next.js check role
- Full access ke user management, statistics, settings
- Bisa promote USER menjadi ADMIN

## 🔒 Security Features

1. ✅ **Default Role USER**: Semua register otomatis role USER
2. ✅ **JWT dengan Role**: Token berisi role, tidak perlu query DB setiap request
3. ✅ **Enum-based**: Type-safe dengan TypeScript enum
4. ✅ **Guard Composition**: JwtAuthGuard + RolesGuard
5. ✅ **Self-protection**: Admin tidak bisa delete/change role sendiri

## 🔧 Decorators

### @Roles(...roles)
```typescript
@Roles(UserRole.ADMIN)
// Hanya ADMIN yang bisa akses
```

### @GetUser(field?)
```typescript
@GetUser() user              // Full user object
@GetUser('id') userId        // User ID
@GetUser('role') role        // User role
@GetUser('email') email      // User email
```

## 📝 Role Hierarchy

```
ADMIN (Full Access)
  ↓
USER (Basic Access)
```

- **ADMIN**: User management + Statistics + All features
- **USER**: Profile + Basic features only

## ⚙️ Migration History

1. `create_users_table` - Initial user table
2. `add_user_roles` - Added role field with USER, ADMIN, SUPERADMIN
3. `simplify_roles_to_user_admin` - **Removed SUPERADMIN, now only USER & ADMIN**

---

**Status**: ✅ RBAC simplified to USER & ADMIN only
**Database**: ✅ Migration applied
**Build**: ✅ No errors
**Ready for**: Flutter App + Next.js Admin Dashboard
