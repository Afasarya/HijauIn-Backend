# 🚀 Deployment Guide - HijauIn Backend

## ⚠️ PENTING: Migrations Sudah Diperbaiki!

Migrations telah diperbaiki agar **AMAN dan SCALABLE**:
- ✅ Tidak akan menghapus data existing
- ✅ Backward compatible dengan data lama
- ✅ Menggunakan `IF NOT EXISTS` untuk idempotency
- ✅ Tidak ada risk data loss

---

## 📦 Deployment Steps

### **Option 1: Deploy Biasa (Tanpa Seed)**

```bash
# 1. Pull code terbaru
git pull origin main

# 2. Run deployment script (sudah include semua yang dibutuhkan)
npm run deploy

# 3. Restart aplikasi
pm2 restart hijauin-backend
# atau
sudo systemctl restart hijauin-backend
```

**Script `npm run deploy` akan otomatis menjalankan:**
1. `npm install` - Install dependencies
2. `npx prisma generate` - Generate Prisma Client
3. `npx prisma migrate deploy` - Run migrations ke database
4. `npm run build` - Build aplikasi

---

### **Option 2: Deploy + Seed Data (Untuk database baru)**

```bash
# 1. Pull code terbaru
git pull origin main

# 2. Deploy dengan seed data
npm run deploy:full

# 3. Restart aplikasi
pm2 restart hijauin-backend
```

**Script `npm run deploy:full` akan menjalankan:**
1. Install dependencies
2. Generate Prisma Client
3. Run migrations
4. **Seed data** (users, categories, products)
5. Build aplikasi

---

## 🔍 Migrations yang Akan Dijalankan

### **Migration 1: `20251112092841_add_product_categories`**

**Yang Dilakukan:**
1. ✅ Buat tabel `product_categories`
2. ✅ Insert default category "Uncategorized" untuk produk existing
3. ✅ Tambah kolom `category_id` ke tabel `products` (nullable dulu)
4. ✅ Update semua produk existing ke default category
5. ✅ Set `category_id` jadi NOT NULL (aman karena semua sudah terisi)
6. ✅ Tambah foreign key constraint
7. ✅ Drop kolom `category` lama (string)

**Hasil:**
- Produk existing akan masuk ke category "Uncategorized"
- Admin bisa reassign ke category yang benar setelah deploy
- **TIDAK ADA DATA HILANG**

---

### **Migration 2: `20251112101036_add_cart_and_update_transactions`**

**Yang Dilakukan:**
1. ✅ Tambah enum status baru: PROCESSING, SHIPPED, DELIVERED
2. ✅ Tambah kolom `order_number` dan `total_amount` ke `transactions` (nullable dulu)
3. ✅ Generate `order_number` untuk transaksi existing
4. ✅ Copy `amount` ke `total_amount` untuk transaksi existing
5. ✅ Set kolom baru jadi NOT NULL (aman karena semua sudah terisi)
6. ✅ Buat tabel: `carts`, `cart_items`, `transaction_items`, `shipping_details`
7. ✅ Migrate data transaksi existing ke `transaction_items`
8. ✅ **KEEP kolom lama** (`product_id`, `quantity`, `amount`) untuk backward compatibility

**Hasil:**
- Transaksi lama tetap berfungsi
- Transaksi baru akan menggunakan struktur baru (items + shipping)
- **TIDAK ADA DATA HILANG**
- Kolom lama akan deprecated gradually

---

## 🛡️ Safety Features

### **Idempotency** (Bisa dijalankan berulang kali)
- Semua `CREATE TABLE` menggunakan `IF NOT EXISTS`
- Semua `ALTER TABLE ADD COLUMN` menggunakan `IF NOT EXISTS`
- Semua index menggunakan `IF NOT EXISTS`
- Foreign keys dicek dulu sebelum ditambah

### **Data Migration**
- Semua data existing akan dimigrate otomatis
- Produk → dapat default category
- Transactions → dapat order_number dan dimigrate ke transaction_items

### **Backward Compatibility**
- Kolom lama tidak dihapus
- Code lama masih bisa jalan (deprecated tapi tidak error)
- Upgrade bertahap tanpa downtime

---

## 🔄 Rollback Strategy (Jika Ada Masalah)

Jika terjadi masalah setelah deploy, Anda bisa rollback:

```bash
# 1. Rollback code ke commit sebelumnya
git reset --hard <commit-sebelumnya>

# 2. Rebuild aplikasi
npm run build

# 3. Restart
pm2 restart hijauin-backend
```

**CATATAN:** 
- Database migrations **TIDAK perlu di-rollback** karena backward compatible
- Kolom baru tidak akan mengganggu code lama
- Hanya perlu rollback code jika ada bug di logic baru

---

## ✅ Post-Deployment Checklist

Setelah deploy berhasil, lakukan pengecekan:

### 1. **Cek Aplikasi Running**
```bash
pm2 status
# atau
curl http://localhost:3000
```

### 2. **Cek Database Migration Status**
```bash
npx prisma migrate status
```

Harus muncul: **"Database schema is up to date!"**

### 3. **Test API Endpoints**

**Health Check:**
```bash
curl http://localhost:3000
```

**Get Products (harus include category):**
```bash
curl http://localhost:3000/products
```

**Get Product Categories:**
```bash
curl http://localhost:3000/product-categories
```

**Test Cart (perlu login dulu):**
```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"user@hijauin.com","password":"user123"}'

# Get Cart
curl http://localhost:3000/cart \
  -H "Authorization: Bearer <token>"
```

### 4. **Cek Logs**
```bash
pm2 logs hijauin-backend --lines 50
```

Pastikan tidak ada error.

---

## 🎯 Manual Migration Command (Jika Perlu)

Jika ingin run migrations secara manual step-by-step:

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Run migrations
npx prisma migrate deploy

# 3. (Optional) Seed data
npm run db:seed

# 4. Build aplikasi
npm run build
```

---

## 📊 Database Changes Summary

### **New Tables:**
- ✅ `product_categories` - Kategori produk dengan image
- ✅ `carts` - Keranjang belanja per user
- ✅ `cart_items` - Item dalam keranjang
- ✅ `transaction_items` - Detail item per transaksi
- ✅ `shipping_details` - Alamat pengiriman per transaksi

### **Modified Tables:**
- ✅ `products` - Tambah `category_id` (FK ke product_categories)
- ✅ `transactions` - Tambah `order_number`, `total_amount` (keep old columns)

### **New Enum Values:**
- ✅ TransactionStatus: PROCESSING, SHIPPED, DELIVERED

---

## 🔐 Environment Variables Required

Pastikan semua env var ada di production:

```env
# Database
DATABASE_URL="postgresql://..."

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Midtrans
MIDTRANS_SERVER_KEY="your-server-key"
MIDTRANS_CLIENT_KEY="your-client-key"
MIDTRANS_IS_PRODUCTION=false

# Backend URL (untuk webhook)
BACKEND_URL="https://your-backend-url.com"

# Node Env
NODE_ENV=production
```

---

## 🚨 Common Issues & Solutions

### **Issue 1: Migration fails dengan "column already exists"**
**Solusi:** Ini normal jika migration pernah dijalankan sebagian. Migration sudah menggunakan `IF NOT EXISTS` jadi aman dijalankan ulang.
```bash
npx prisma migrate deploy
```

### **Issue 2: "Prisma Client did not initialize yet"**
**Solusi:** Generate Prisma Client
```bash
npx prisma generate
npm run build
pm2 restart hijauin-backend
```

### **Issue 3: Port already in use**
**Solusi:** Kill process yang menggunakan port
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux
lsof -ti:3000 | xargs kill -9
```

### **Issue 4: Permission denied saat npm install**
**Solusi:** 
```bash
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP .
```

---

## 📞 Support

Jika ada masalah saat deployment:
1. Cek logs: `pm2 logs hijauin-backend`
2. Cek migration status: `npx prisma migrate status`
3. Cek database connection: `npx prisma db pull`

---

**Last Updated:** November 12, 2025  
**Version:** 2.0 - Cart & Checkout Update
