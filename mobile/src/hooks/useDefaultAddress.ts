import { useAddress } from '@/context/AddressContext';
import { Address } from '@/types/address.types';

/**
 * Utility hook for easily accessing address information throughout the app
 * This hook provides convenient access to default and selected addresses
 */
export const useDefaultAddress = () => {
  const { 
    selectedAddress, 
    defaultAddress, 
    savedAddresses, 
    setSelectedAddress, 
    setAsDefault,
    loading,
    refreshAddresses
  } = useAddress();

  /**
   * Get the primary address to use for deliveries
   * Priority: selectedAddress -> defaultAddress -> first saved address -> null
   */
  const getPrimaryAddress = (): Address | null => {
    return selectedAddress || defaultAddress || (savedAddresses.length > 0 ? savedAddresses[0] : null);
  };

  /**
   * Get formatted address string for display
   */
  const getFormattedAddress = (address?: Address | null): string => {
    const addr = address || getPrimaryAddress();
    if (!addr) return 'No address selected';
    
    return `${addr.label}, ${addr.city}`;
  };

  /**
   * Get full formatted address string
   */
  const getFullFormattedAddress = (address?: Address | null): string => {
    const addr = address || getPrimaryAddress();
    if (!addr) return 'Please add an address';
    
    return [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ');
  };

  /**
   * Check if user has any addresses
   */
  const hasAddresses = (): boolean => {
    return savedAddresses.length > 0;
  };

  /**
   * Check if the given address is the default address
   */
  const isDefaultAddress = (address: Address): boolean => {
    return address.isDefault || false;
  };

  /**
   * Check if the given address is currently selected
   */
  const isSelectedAddress = (address: Address): boolean => {
    return selectedAddress?.label === address.label && selectedAddress?.street === address.street;
  };

  return {
    // Core address data
    selectedAddress,
    defaultAddress,
    savedAddresses,
    primaryAddress: getPrimaryAddress(),
    
    // Actions
    setSelectedAddress,
    setAsDefault,
    refreshAddresses,
    
    // Utility functions
    getFormattedAddress,
    getFullFormattedAddress,
    hasAddresses,
    isDefaultAddress,
    isSelectedAddress,
    
    // Status
    loading,
  };
};