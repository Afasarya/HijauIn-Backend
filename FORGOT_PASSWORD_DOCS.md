# 🔐 Forgot Password & Reset Password - Documentation

## ✅ Fitur Lengkap

Sistem Forgot Password & Reset Password telah diimplementasikan dengan:
- ✅ Resend API untuk mengirim email
- ✅ Token-based reset dengan expiry 15 menit
- ✅ Validasi lengkap dengan class-validator
- ✅ Clean architecture dengan dependency injection
- ✅ Error handling yang comprehensive

## 🏗️ Struktur Database

### Model PasswordResetToken
```prisma
model PasswordResetToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@map("password_reset_tokens")
}
```

## 🔑 Test Credentials

Gunakan akun ini untuk testing forgot password:

### Test User (Arya Fathdillah)
```
Email: coderea9@gmail.com
Password: arya123
```

### Admin
```
Email: admin@hijauin.com
Password: admin123
```

### Regular User
```
Email: user@hijauin.com
Password: user123
```

## 📋 API Endpoints

### 1. Forgot Password
**Endpoint:** `POST /auth/forgot-password`

**Request Body:**
```json
{
  "email": "coderea9@gmail.com"
}
```

**Success Response (200):**
```json
{
  "message": "Password reset email sent successfully"
}
```

**Error Responses:**
- `404` - Email not found
- `400` - Failed to send email

**Process:**
1. Validasi email terdaftar di database
2. Hapus token lama user yang belum digunakan
3. Generate token UUID baru
4. Simpan token dengan expiry 15 menit
5. Kirim email via Resend API ke `coderea9@gmail.com`
6. Email berisi link: `http://localhost:3000/reset-password?token=<uuid>`

### 2. Reset Password
**Endpoint:** `POST /auth/reset-password`

**Request Body:**
```json
{
  "token": "generated-uuid-token",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

**Error Responses:**
- `400` - Invalid or expired token
- `400` - Token already used
- `400` - Password mismatch
- `400` - Token expired (>15 minutes)

**Process:**
1. Cari token di database
2. Validasi token valid, belum expired, dan belum digunakan
3. Hash password baru dengan bcrypt
4. Update password user
5. Tandai token sebagai `used = true`

## 🧪 Testing dengan Postman

### Test 1: Request Forgot Password

```bash
POST http://localhost:3000/auth/forgot-password
Content-Type: application/json

{
  "email": "coderea9@gmail.com"
}
```

**Expected:**
- Status: 200
- Response: `{ "message": "Password reset email sent successfully" }`
- Email diterima di `coderea9@gmail.com` dengan link reset password

### Test 2: Cek Email

Setelah request forgot password, cek email Anda di `coderea9@gmail.com`. Email akan berisi:
- Subject: "Reset Password - HijauIn"
- From: "HijauIn <no-reply@hijauin.com>"
- Button/Link: Reset Password dengan URL berisi token

### Test 3: Reset Password dengan Token

Copy token dari email (dari URL parameter), lalu:

```bash
POST http://localhost:3000/auth/reset-password
Content-Type: application/json

{
  "token": "paste-token-dari-email",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

**Expected:**
- Status: 200
- Response: `{ "message": "Password reset successfully" }`

### Test 4: Login dengan Password Baru

```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "emailOrUsername": "coderea9@gmail.com",
  "password": "newPassword123"
}
```

**Expected:**
- Status: 200
- Response berisi `access_token` dan data user

## 🔒 Security Features

### 1. Token Expiration
- Token berlaku **15 menit** sejak dibuat
- Setelah 15 menit, token tidak bisa digunakan

### 2. One-Time Use
- Token hanya bisa digunakan **1 kali**
- Setelah digunakan, tandai `used = true`

### 3. Token Cleanup
- Saat request forgot password baru, **hapus token lama** yang belum digunakan
- Mencegah akumulasi token tidak terpakai

### 4. Password Validation
- Minimum 6 karakter
- Password dan confirmPassword harus cocok
- Password di-hash dengan bcrypt (salt rounds: 10)

### 5. Cascade Delete
- Jika user dihapus, semua token reset password-nya ikut terhapus
- Menggunakan `onDelete: Cascade` di Prisma

## 📧 Email Template

Email yang dikirim via Resend API:

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2ecc71;">Reset Password - HijauIn</h2>
  <p>Halo,</p>
  <p>Kami menerima permintaan untuk mereset password akun Anda.</p>
  <p>Klik tombol di bawah ini untuk mereset password Anda:</p>
  <div style="margin: 30px 0;">
    <a href="http://localhost:3000/reset-password?token={token}" 
       style="background-color: #2ecc71; color: white; padding: 12px 30px; 
              text-decoration: none; border-radius: 5px; display: inline-block;">
      Reset Password
    </a>
  </div>
  <p>Link ini akan kadaluarsa dalam 15 menit.</p>
</div>
```

## ⚙️ Environment Variables

Pastikan file `.env` berisi:

```env
RESEND_API_KEY="re_46gfTWb7_DxtrmbYqzTPpkHjHddq2rSJ4"
RESET_PASSWORD_URL="http://localhost:3000/reset-password?token="
```

## 🚀 Cara Menjalankan

```bash
# 1. Start development server
npm run start:dev

# 2. Server berjalan di http://localhost:3000

# 3. Test dengan Postman
POST http://localhost:3000/auth/forgot-password
```

## 🧩 Architecture

### Flow Diagram

```
1. User Request Forgot Password
   ↓
2. Validate Email Exists
   ↓
3. Delete Old Unused Tokens
   ↓
4. Generate UUID Token
   ↓
5. Save Token to DB (expires in 15 min)
   ↓
6. Send Email via Resend API
   ↓
7. User Receives Email
   ↓
8. User Clicks Link / Copy Token
   ↓
9. User Submit New Password
   ↓
10. Validate Token (exists, not expired, not used)
   ↓
11. Hash New Password
   ↓
12. Update User Password
   ↓
13. Mark Token as Used
   ↓
14. Success Response
```

### Dependencies

```typescript
AuthService:
  ├── PrismaService (Database)
  ├── JwtService (JWT generation)
  ├── ConfigService (Environment variables)
  └── MailService (Email sending)

MailService:
  ├── ConfigService (API keys)
  └── axios (HTTP client for Resend API)
```

## 🧪 Test Cases

### Positive Cases

✅ **Test 1:** Forgot password dengan email terdaftar
- Input: `coderea9@gmail.com`
- Expected: Email terkirim, status 200

✅ **Test 2:** Reset password dengan token valid
- Input: Valid token, matching passwords
- Expected: Password berhasil diupdate, status 200

✅ **Test 3:** Login dengan password baru
- Input: Email + new password
- Expected: Login berhasil, dapat access token

### Negative Cases

❌ **Test 4:** Forgot password dengan email tidak terdaftar
- Input: `notfound@example.com`
- Expected: Status 404, "Email not found"

❌ **Test 5:** Reset password dengan token expired
- Input: Token > 15 menit
- Expected: Status 400, "Token has expired"

❌ **Test 6:** Reset password dengan token sudah digunakan
- Input: Token yang sudah pernah dipakai
- Expected: Status 400, "Token has already been used"

❌ **Test 7:** Reset password dengan password tidak match
- Input: `newPassword` ≠ `confirmPassword`
- Expected: Status 400, "Password and confirm password do not match"

❌ **Test 8:** Reset password dengan token invalid
- Input: Random string / token tidak ada di DB
- Expected: Status 400, "Invalid or expired token"

## 📝 Notes

1. **Email Domain:** Email dari `no-reply@hijauin.com` harus sudah diverifikasi di Resend dashboard
2. **Rate Limiting:** Pertimbangkan menambahkan rate limiting untuk endpoint forgot password
3. **Token Length:** Token menggunakan UUID v4 (36 karakter)
4. **Timezone:** Expiry time menggunakan server timezone
5. **Production URL:** Ganti `RESET_PASSWORD_URL` dengan domain production saat deploy

## 🔧 Troubleshooting

### Email tidak terkirim
- Cek Resend API key valid
- Cek domain `hijauin.com` sudah diverifikasi di Resend
- Cek logs di console untuk error detail

### Token tidak ditemukan
- Pastikan copy token lengkap dari email
- Cek token belum expired (15 menit)
- Cek token belum pernah digunakan

### Password tidak terupdate
- Cek validasi password match
- Cek minimum 6 karakter
- Cek token valid dan belum expired

---

**Status:** ✅ Forgot Password & Reset Password fully implemented
**Email Testing:** ✅ Ready to test with coderea9@gmail.com
**Database:** ✅ Clean migrations applied
**Build:** ✅ No errors
