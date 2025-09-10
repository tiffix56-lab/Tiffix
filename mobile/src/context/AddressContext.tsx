import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Address } from '@/types/address.types';
import { addressService } from '@/services/address.service';

interface AddressContextType {
  selectedAddress: Address | null;
  setSelectedAddress: (address: Address | null) => void;
  savedAddresses: Address[];
  setSavedAddresses: (addresses: Address[]) => void;
  loading: boolean;
  refreshAddresses: () => Promise<void>;
  isServiceableAddress: (address: Address) => boolean;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

interface AddressProviderProps {
  children: ReactNode;
}

export const AddressProvider: React.FC<AddressProviderProps> = ({ children }) => {
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshAddresses = async () => {
    try {
      setLoading(true);
      const response = await addressService.getAllAddresses();
      
      if (response.success && response.data?.addresses) {
        const addresses = response.data.addresses.filter((addr: Address) => 
          addr && addr.label && addr.street && addr.city && addr.state
        );
        
        setSavedAddresses(addresses);
        
        // Auto-select default address if no address is currently selected
        if (!selectedAddress) {
          const defaultAddress = addresses.find((addr: Address) => addr.isDefault);
          if (defaultAddress) {
            setSelectedAddress(defaultAddress);
          }
        }
      } else {
        setSavedAddresses([]);
      }
    } catch (error) {
      console.error('Error refreshing addresses:', error);
      setSavedAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  // Serviceability check - should be done via API call
  const isServiceableAddress = (address: Address): boolean => {
    // For now, assume all addresses are potentially serviceable
    // The actual serviceability check will be done by the backend
    // when the order is placed, which will show proper error messages
    return true;
  };

  useEffect(() => {
    refreshAddresses();
  }, []);

  const value: AddressContextType = {
    selectedAddress,
    setSelectedAddress,
    savedAddresses,
    setSavedAddresses,
    loading,
    refreshAddresses,
    isServiceableAddress,
  };

  return (
    <AddressContext.Provider value={value}>
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = (): AddressContextType => {
  const context = useContext(AddressContext);
  if (context === undefined) {
    throw new Error('useAddress must be used within an AddressProvider');
  }
  return context;
};

export default AddressContext;