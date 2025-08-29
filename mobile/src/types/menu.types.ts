export interface MenuItem {
  _id: string;
  foodImage: string;
  foodSubImages: string[];
  foodTitle: string;
  price: number;
  description: {
    short: string;
    long?: string;
  };
  detailedItemList: string;
  vendorCategory: 'vendor' | 'home_chef';
  cuisine: string;
  prepTime: number;
  calories: number;
  dietaryOptions: ('vegetarian' | 'vegan' | 'gluten-free' | 'non-vegetarian' | 'dairy-free' | 'halal' | 'kosher' | 'nut-free')[];
  isAvailable: boolean;
  rating: {
    average: number;
    totalReviews: number;
  };
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuResponse {
  menus: MenuItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface MenuQuery {
  page?: number;
  limit?: number;
  vendorCategory?: 'vendor' | 'home_chef';
  cuisine?: string;
  dietaryOptions?: string;
  tags?: string;
  isAvailable?: boolean;
  sortBy?: 'createdAt' | 'price' | 'rating.average' | 'prepTime';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}