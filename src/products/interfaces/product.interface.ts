export interface ProductResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  priceFormatted: string;
  stock: number;
  image_url: string | null;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedProductsResponse {
  data: ProductResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
