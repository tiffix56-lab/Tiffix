export interface Response {
  success: boolean;
  statusCode: number;
  request: {
    ip: string;
    method: string;
    url: string;
  };
  message: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}



// MENU

export interface Menu {
  description: {
    short: string;
    long: string;
  };
  rating: {
    average: number;
    totalReviews: number;
  };
  nutritionalInfo: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  _id: string;
  foodImage: string;
  foodSubImages: string[];
  foodTitle: string;
  price: number;
  creditsRequired: number;
  detailedItemList: string;
  vendorCategory: string;
  cuisine: string;
  prepTime: number;
  calories: number;
  dietaryOptions: string[];
  isAvailable: boolean;
  tags: string[];
  allergens: string[];
  servingSize: string;
  availableQuantity: number;
  soldToday: number;
  maxOrdersPerDay: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface MenuResponse extends Response {
  data: {
    menus: Menu[];
    pagination: Pagination;
  };
}


