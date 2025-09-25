import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Address } from '@/types/address.types';
import { addressService } from '@/services/address.service';
import { storageService } from '@/services/storage.service';

interface AddressContextType {
  selectedAddress: Address | null;
  setSelectedAddress: (address: Address | null) => void;
  savedAddresses: Address[];
  setSavedAddresses: (addresses: Address[]) => void;
  defaultAddress: Address | null;
  loading: boolean;
  refreshAddresses: () => Promise<void>;
  isServiceableAddress: (address: Address) => boolean;
  setAsDefault: (address: Address) => Promise<void>;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

interface AddressProviderProps {
  children: ReactNode;
}

export const AddressProvider: React.FC<AddressProviderProps> = ({ children }) => {
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
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
        
        // Set default address
        const foundDefaultAddress = addresses.find((addr: Address) => addr.isDefault);
        setDefaultAddress(foundDefaultAddress || null);
        
        // Auto-select default address if no address is currently selected
        if (!selectedAddress) {
          if (foundDefaultAddress) {
            setSelectedAddress(foundDefaultAddress);
            await persistSelectedAddress(foundDefaultAddress);
          } else if (addresses.length > 0) {
            // If no default, use first address
            setSelectedAddress(addresses[0]);
            await persistSelectedAddress(addresses[0]);
          }
        }
      } else {
        setSavedAddresses([]);
        setDefaultAddress(null);
      }
    } catch (error) {
      console.error('Error refreshing addresses:', error);
      setSavedAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  // Persist selected address to storage
  const persistSelectedAddress = async (address: Address | null) => {
    try {
      if (address) {
        await storageService.setItem('selectedAddress', JSON.stringify(address));
      } else {
        await storageService.removeItem('selectedAddress');
      }
    } catch (error) {
      console.error('Error persisting selected address:', error);
    }
  };

  // Enhanced setSelectedAddress with persistence
  const handleSetSelectedAddress = async (address: Address | null) => {
    setSelectedAddress(address);
    await persistSelectedAddress(address);
  };

  // Set address as default
  const setAsDefault = async (address: Address) => {
    try {
      // Find the index of the address in the savedAddresses array
      const addressIndex = savedAddresses.findIndex(addr => 
        addr.label === address.label && addr.street === address.street
      );
      
      if (addressIndex === -1) {
        console.error('Address not found in saved addresses');
        return;
      }
      
      const response = await addressService.setDefaultAddress(addressIndex);
      if (response.success) {
        await refreshAddresses();
        setSelectedAddress(address);
        await persistSelectedAddress(address);
      }
    } catch (error) {
      console.error('Error setting default address:', error);
    }
  };

  // Serviceability check - should be done via API call
  const isServiceableAddress = (address: Address): boolean => {
    // For now, assume all addresses are potentially serviceable
    // The actual serviceability check will be done by the backend
    // when the order is placed, which will show proper error messages
    return true;
  };

  // Load persisted selected address on app start
  const loadPersistedAddress = async () => {
    try {
      const persistedAddress = await storageService.getItem('selectedAddress');
      if (persistedAddress) {
        const address = JSON.parse(persistedAddress) as Address;
        setSelectedAddress(address);
      }
    } catch (error) {
      console.error('Error loading persisted address:', error);
    }
  };

  useEffect(() => {
    loadPersistedAddress();
    refreshAddresses();
  }, []);

  const value: AddressContextType = {
    selectedAddress,
    setSelectedAddress: handleSetSelectedAddress,
    savedAddresses,
    setSavedAddresses,
    defaultAddress,
    loading,
    refreshAddresses,
    isServiceableAddress,
    setAsDefault,
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