import React, { useState, useEffect } from 'react';
import { 
  Clock, Calendar, Save, RotateCcw, ChefHat, Package,
  Plus, Minus, AlertCircle, Check, X
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';

const Availability = () => {
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [availability, setAvailability] = useState({
    isOpen: true,
    dailyCapacity: 50,
    currentOrders: 25,
    timeSlots: [
      { id: 1, start: '12:00', end: '14:00', capacity: 25, orders: 15, isActive: true },
      { id: 2, start: '19:00', end: '21:00', capacity: 25, orders: 10, isActive: true }
    ],
    weeklySchedule: {
      monday: { isActive: true, capacity: 50 },
      tuesday: { isActive: true, capacity: 50 },
      wednesday: { isActive: true, capacity: 45 },
      thursday: { isActive: true, capacity: 50 },
      friday: { isActive: true, capacity: 60 },
      saturday: { isActive: true, capacity: 40 },
      sunday: { isActive: false, capacity: 0 }
    },
    specialDates: [
      { date: '2024-01-26', isAvailable: false, reason: 'Republic Day Holiday' },
      { date: '2024-03-08', isAvailable: false, reason: 'Holi Festival' }
    ]
  });

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const updateDayAvailability = (day, field, value) => {
    setAvailability(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day],
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const updateTimeSlot = (id, field, value) => {
    setAvailability(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map(slot =>
        slot.id === id ? { ...slot, [field]: value } : slot
      )
    }));
    setHasChanges(true);
  };

  const addTimeSlot = () => {
    const newSlot = {
      id: Date.now(),
      start: '12:00',
      end: '14:00',
      capacity: 20,
      orders: 0,
      isActive: true
    };
    setAvailability(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, newSlot]
    }));
    setHasChanges(true);
  };

  const removeTimeSlot = (id) => {
    setAvailability(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter(slot => slot.id !== id)
    }));
    setHasChanges(true);
  };

  const saveChanges = () => {
    // Simulate API call
    setTimeout(() => {
      setHasChanges(false);
      // Show success message
    }, 1000);
  };

  const resetChanges = () => {
    // Reset to original data
    setHasChanges(false);
  };

  const getUtilizationPercentage = (orders, capacity) => {
    return capacity > 0 ? Math.round((orders / capacity) * 100) : 0;
  };

  const getUtilizationColor = (percentage) => {
    if (percentage >= 90) return 'red';
    if (percentage >= 70) return 'yellow';
    return 'green';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const totalUtilization = getUtilizationPercentage(availability.currentOrders, availability.dailyCapacity);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Availability Management</h1>
          <p className="text-gray-400 mt-1">Manage your service hours and capacity</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="secondary" onClick={resetChanges} className="flex items-center gap-2">
              <RotateCcw size={16} />
              Reset
            </Button>
          )}
          <Button 
            onClick={saveChanges} 
            disabled={!hasChanges}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${availability.isOpen ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {availability.isOpen ? 
                <Check className="text-green-500" size={24} /> :
                <X className="text-red-500" size={24} />
              }
            </div>
            <div>
              <p className="text-gray-400 text-sm">Status</p>
              <p className="text-xl font-bold text-white">
                {availability.isOpen ? 'Open' : 'Closed'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Package className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Daily Capacity</p>
              <p className="text-xl font-bold text-white">{availability.dailyCapacity}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <ChefHat className="text-orange-500" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Current Orders</p>
              <p className="text-xl font-bold text-white">{availability.currentOrders}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              totalUtilization >= 90 ? 'bg-red-500/20' :
              totalUtilization >= 70 ? 'bg-yellow-500/20' : 'bg-green-500/20'
            }`}>
              <AlertCircle className={
                totalUtilization >= 90 ? 'text-red-500' :
                totalUtilization >= 70 ? 'text-yellow-500' : 'text-green-500'
              } size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Utilization</p>
              <p className="text-xl font-bold text-white">{totalUtilization}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Time Slots Management */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">Delivery Time Slots</h3>
          <Button onClick={addTimeSlot} className="flex items-center gap-2">
            <Plus size={16} />
            Add Slot
          </Button>
        </div>
        <div className="space-y-4">
          {availability.timeSlots.map((slot) => {
            const utilization = getUtilizationPercentage(slot.orders, slot.capacity);
            return (
              <div key={slot.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  <div className="md:col-span-2">
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateTimeSlot(slot.id, 'start', e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-gray-400 self-center">to</span>
                      <Input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateTimeSlot(slot.id, 'end', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Input
                      type="number"
                      label="Capacity"
                      value={slot.capacity}
                      onChange={(e) => updateTimeSlot(slot.id, 'capacity', parseInt(e.target.value))}
                      min="1"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Current Orders</p>
                    <p className="text-lg font-semibold text-white">{slot.orders}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Utilization</p>
                    <Badge color={getUtilizationColor(utilization)}>{utilization}%</Badge>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => updateTimeSlot(slot.id, 'isActive', !slot.isActive)}
                      className={`p-2 rounded ${slot.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
                    >
                      {slot.isActive ? <Check size={16} /> : <X size={16} />}
                    </button>
                    <button
                      onClick={() => removeTimeSlot(slot.id)}
                      className="p-2 rounded bg-red-500/20 text-red-500 hover:bg-red-500/30"
                    >
                      <Minus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Weekly Schedule */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Weekly Schedule</h3>
        <div className="space-y-4">
          {days.map(({ key, label }) => {
            const dayData = availability.weeklySchedule[key];
            return (
              <div key={key} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3 min-w-[120px]">
                  <button
                    onClick={() => updateDayAvailability(key, 'isActive', !dayData.isActive)}
                    className={`p-2 rounded ${dayData.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
                  >
                    {dayData.isActive ? <Check size={16} /> : <X size={16} />}
                  </button>
                  <span className="font-medium text-white">{label}</span>
                </div>
                <div className="flex-1">
                  <Input
                    type="number"
                    label="Capacity"
                    value={dayData.capacity}
                    onChange={(e) => updateDayAvailability(key, 'capacity', parseInt(e.target.value))}
                    disabled={!dayData.isActive}
                    min="0"
                    className="max-w-32"
                  />
                </div>
                <div className="text-sm text-gray-400">
                  {dayData.isActive ? `${dayData.capacity} orders` : 'Closed'}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Special Dates */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">Special Dates & Holidays</h3>
          <Button variant="secondary" className="flex items-center gap-2">
            <Plus size={16} />
            Add Special Date
          </Button>
        </div>
        <div className="space-y-3">
          {availability.specialDates.map((special, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-4">
                <Calendar size={16} className="text-gray-400" />
                <div>
                  <p className="text-white font-medium">{new Date(special.date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-400">{special.reason}</p>
                </div>
              </div>
              <Badge color={special.isAvailable ? 'green' : 'red'}>
                {special.isAvailable ? 'Available' : 'Closed'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Availability;