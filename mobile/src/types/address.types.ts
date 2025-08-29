export interface Address {
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  isDefault: boolean;
}

export interface AddAddressRequest {
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: {
    type: 'Point';
    coordinates: [number, number];
  };
  isDefault?: boolean;
}

export interface UserProfile {
  _id: string;
  userId: string;
  addresses: Address[];
  preferences: {
    dietary: string[];
    cuisineTypes: string[];
    spiceLevel: 'mild' | 'medium' | 'hot' | 'extra-hot';
  };
  activeSubscriptions: string[];
  createdAt: string;
  updatedAt: string;
}