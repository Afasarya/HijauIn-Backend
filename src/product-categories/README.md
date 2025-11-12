# Product Categories API Documentation

## Base URL
```
http://localhost:3000/product-categories
```

## Endpoints

### 1. Create Product Category (Admin Only)
**POST** `/product-categories`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Personal Care",
  "description": "Produk perawatan diri ramah lingkungan",
  "image_url": "https://images.unsplash.com/photo-1556228578-8c89e6adf883"
}
```

**Response Success (201):**
```json
{
  "message": "Product category created successfully",
  "data": {
    "id": "uuid",
    "name": "Personal Care",
    "description": "Produk perawatan diri ramah lingkungan",
    "image_url": "https://images.unsplash.com/photo-1556228578-8c89e6adf883",
    "createdAt": "2025-11-12T09:30:00.000Z",
    "updatedAt": "2025-11-12T09:30:00.000Z"
  }
}
```

---

### 2. Get All Product Categories (Public)
**GET** `/product-categories`

**Response Success (200):**
```json
{
  "message": "Product categories retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Personal Care",
      "description": "Produk perawatan diri ramah lingkungan",
      "image_url": "https://images.unsplash.com/photo-1556228578-8c89e6adf883",
      "createdAt": "2025-11-12T09:30:00.000Z",
      "updatedAt": "2025-11-12T09:30:00.000Z",
      "_count": {
        "products": 2
      }
    },
    {
      "id": "uuid",
      "name": "Kitchen",
      "description": "Peralatan dapur eco-friendly",
      "image_url": "https://images.unsplash.com/photo-1556911220-bff31c812dba",
      "createdAt": "2025-11-12T09:30:00.000Z",
      "updatedAt": "2025-11-12T09:30:00.000Z",
      "_count": {
        "products": 2
      }
    }
  ]
}
```

---

### 3. Get Single Product Category (Public)
**GET** `/product-categories/:id`

**Response Success (200):**
```json
{
  "message": "Product category retrieved successfully",
  "data": {
    "id": "uuid",
    "name": "Personal Care",
    "description": "Produk perawatan diri ramah lingkungan",
    "image_url": "https://images.unsplash.com/photo-1556228578-8c89e6adf883",
    "createdAt": "2025-11-12T09:30:00.000Z",
    "updatedAt": "2025-11-12T09:30:00.000Z",
    "products": [
      {
        "id": "uuid",
        "name": "Bamboo Toothbrush",
        "price": 25000,
        "stock": 100,
        "image_url": "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04"
      }
    ],
    "_count": {
      "products": 1
    }
  }
}
```

---

### 4. Update Product Category (Admin Only)
**PATCH** `/product-categories/:id`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Personal Care Updated",
  "description": "Updated description",
  "image_url": "https://new-image-url.com/image.jpg"
}
```

**Response Success (200):**
```json
{
  "message": "Product category updated successfully",
  "data": {
    "id": "uuid",
    "name": "Personal Care Updated",
    "description": "Updated description",
    "image_url": "https://new-image-url.com/image.jpg",
    "createdAt": "2025-11-12T09:30:00.000Z",
    "updatedAt": "2025-11-12T09:35:00.000Z"
  }
}
```

---

### 5. Delete Product Category (Admin Only)
**DELETE** `/product-categories/:id`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response Success (200):**
```json
{
  "message": "Product category deleted successfully"
}
```

**Response Error (400) - Has Products:**
```json
{
  "statusCode": 400,
  "message": "Cannot delete category with 5 existing product(s). Please move or delete the products first.",
  "error": "Bad Request"
}
```

---

## Error Responses

### 404 - Not Found
```json
{
  "statusCode": 404,
  "message": "Product category with ID {id} not found",
  "error": "Not Found"
}
```

### 409 - Conflict (Duplicate Name)
```json
{
  "statusCode": 409,
  "message": "Category name already exists",
  "error": "Conflict"
}
```

### 401 - Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 - Forbidden (Not Admin)
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

---

## Notes

- **Create, Update, Delete** endpoints require **ADMIN** role
- **Get All** and **Get Single** endpoints are **public** (no authentication required)
- Category name must be **unique**
- Cannot delete category that has products associated with it
- All fields in update are **optional**
