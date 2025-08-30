import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Feather } from '@expo/vector-icons';
import ThemeToggle from '../ui/ThemeToggle';
import { addressService } from '@/services/address.service';

const Header = () => {
  const { colorScheme } = useColorScheme();
  const [currentLocation, setCurrentLocation] = useState<string>('Loading...');
  const [addresses, setAddresses] = useState<any[]>([]);

  useEffect(() => {
    fetchUserAddresses();
  }, []);

  const fetchUserAddresses = async () => {
    try {
      const response = await addressService.getAllAddresses();
      if (response.success && response.data?.addresses && response.data.addresses.length > 0) {
        setAddresses(response.data.addresses);
        
        // Find default address or use first address
        const primaryAddress = response.data.addresses.find((addr: any) => addr.isDefault) 
          || response.data.addresses[0];
        
        if (primaryAddress) {
          const locationText = `${primaryAddress.label || primaryAddress.street}, ${primaryAddress.city}`;
          setCurrentLocation(locationText);
        } else {
          setCurrentLocation('Add Address');
        }
      } else {
        setCurrentLocation('Add Address');
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setCurrentLocation('Add Address');
    }
  };

  const truncateLocation = (location: string, maxLength: number = 25) => {
    if (location.length <= maxLength) return location;
    return location.substring(0, maxLength) + '...';
  };

  return (
    <View className="px-6 pb-6 pt-16">
      <View className="flex-row items-center justify-between">
        <TouchableOpacity className="flex-1 flex-row items-center" activeOpacity={0.7}>
          <Feather
            name="map-pin"
            size={18}
            color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
          />
          <Text
            className="ml-2 text-sm font-medium text-black dark:text-white"
            style={{ fontFamily: 'Poppins_500Medium' }}
            numberOfLines={1}>
            {truncateLocation(currentLocation)}
          </Text>
          <Feather
            name="chevron-down"
            size={16}
            color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>

        <View className="flex-row items-center space-x-3">
          <TouchableOpacity className="p-2">
            <Feather name="bell" size={22} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
          <ThemeToggle />
        </View>
      </View>
    </View>
  );
};

export default Header;
