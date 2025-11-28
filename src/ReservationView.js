// ImprovedReservationView.js - Replace the reservation section in your App.js

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Monitor, Laptop, Package, BookOpen, 
  Users, MapPin, AlertCircle, CheckCircle, Search, 
  Filter, ChevronRight, Loader, Info, Building
} from 'lucide-react';
import { API_CONFIG } from './config.js';

const ReservationView = ({ currentUser, onReservationCreated, onBackToDashboard }) => {
  const [reservationMethod, setReservationMethod] = useState('quick'); // 'quick' or 'detailed'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Quick Reserve State
  const [quickReserveForm, setQuickReserveForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    category: ''
  });

  const [quickAvailableResources, setQuickAvailableResources] = useState([]);
  const [quickReserveStep, setQuickReserveStep] = useState(1); // 1: time & category, 2: resource selection

  // Detailed Search State
  const [detailedFilters, setDetailedFilters] = useState({
    category: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    minCapacity: '',
    building: ''
  });

  const [searchResults, setSearchResults] = useState({});
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Get current time with 8 AM minimum
  const getCurrentMinTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // If it's before 8 AM or we're selecting a future date, minimum is 8:00
    if (currentHour < 8 || quickReserveForm.date > new Date().toISOString().split('T')[0]) {
      return '08:00';
    }
    
    // If it's after 8 PM, no slots available for today
    if (currentHour >= 20) {
      return '20:00'; // Will make all times unavailable
    }
    
    // Round up to next 30-minute slot
    const roundedMinute = currentMinute < 30 ? 30 : 0;
    const nextHour = currentMinute < 30 ? currentHour : currentHour + 1;
    
    return `${nextHour.toString().padStart(2, '0')}:${roundedMinute.toString().padStart(2, '0')}`;
  };

  // Validate end time (minimum 30 minutes after start, maximum 8 PM)
  const getMinEndTime = (startTime) => {
    if (!startTime) return '08:30';
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    startDate.setMinutes(startDate.getMinutes() + 30); // Add 30 minutes
    
    const endHours = startDate.getHours();
    const endMinutes = startDate.getMinutes();
    
    // Don't allow end time after 8 PM
    if (endHours >= 20) {
      return '20:00';
    }
    
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Reset to step 1 when method changes
    if (reservationMethod === 'quick') {
      setQuickReserveStep(1);
      setQuickAvailableResources([]);
    } else {
      setShowSearchResults(false);
    }
  }, [reservationMethod]);

    useEffect(() => {
        // Clear search results when category or building changes significantly
        if (showSearchResults) {
            const validationError = validateFilters();
            if (validationError) {
            setShowSearchResults(false);
            setSearchResults({});
            }
        }
    }, [detailedFilters.category, detailedFilters.building]);

    useEffect(() => {
        if (showSearchResults) {
            // Clear search results when any time-related filter changes
            setShowSearchResults(false);
            setSearchResults({});
        }
    }, [detailedFilters.startTime, detailedFilters.endTime, detailedFilters.date]);

    const validateReservationTimes = (startTime, endTime) => {
        // Check business hours (8:00 AM - 8:00 PM)
        if (startTime < '08:00' || endTime > '20:00') {
            return 'Reservation times must be between 8:00 AM and 8:00 PM';
        }
        
        // Check minimum duration (30 minutes)
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        const diffMinutes = (end - start) / (1000 * 60);
        
        if (diffMinutes < 30) {
            return 'Reservation must be at least 30 minutes long';
        }
        
        if (diffMinutes > 480) { // 8 hours
            return 'Reservation cannot be longer than 8 hours';
        }
        
        return null; // Valid
    };

  const handleQuickReserveSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!quickReserveForm.category) {
        setError('Please select a resource category');
        return;
      }

      // Validate times
      if (quickReserveForm.startTime < '08:00' || quickReserveForm.endTime > '20:00') {
        setError('Reservation times must be between 8:00 AM and 8:00 PM');
        return;
      }

      const params = new URLSearchParams({
        date: quickReserveForm.date,
        startTime: quickReserveForm.startTime,
        endTime: quickReserveForm.endTime,
        category: quickReserveForm.category
      });

      const response = await fetch(API_CONFIG.getApiUrl(`/resources/available?${params}`));
      if (response.ok) {
        const results = await response.json();
        
        if (!results[quickReserveForm.category] || results[quickReserveForm.category].length === 0) {
          setError(`No ${quickReserveForm.category.toLowerCase()} available for the selected time. Please try a different time.`);
          return;
        }

        setQuickAvailableResources(results[quickReserveForm.category]);
        setQuickReserveStep(2);
      } else {
        setError('Failed to search for available resources');
      }
    } catch (error) {
      console.error('Quick reserve search failed:', error);
      setError('Failed to load available resources');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReserveResource = async (resource) => {
    try {
      setLoading(true);
      setError(null);

      // Here you would create the reservation
      const reservationData = {
        userId: currentUser.id,
        resourceType: quickReserveForm.category,
        resourceName: resource.name,
        date: quickReserveForm.date,
        startTime: quickReserveForm.startTime,
        endTime: quickReserveForm.endTime,
        purpose: 'Quick reservation',
        peopleCount: 1
      };

      // Call your reservation API
      const response = await fetch(API_CONFIG.getApiUrl('/reservations'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      });

      if (response.ok) {
        alert('Reservation created successfully!');
        if (onReservationCreated) onReservationCreated();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create reservation');
      }
    } catch (error) {
      console.error('Reservation failed:', error);
      setError('Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

    const validateFilters = () => {
        // Check for logical mismatches between category and building
        const categoryBuildingMap = {
            'Study Rooms': ['MAIN', 'AC', 'IE', 'RES', 'LIB', 'REC-CULT'],
            'Computer Labs': ['AC', 'RES'],
            'Equipment': ['MAIN', 'AC', 'REC-CULT', 'RES'],
            'Library Resources': ['LIB'],
            'Medical Services': ['MED-DISP', 'MED-PSY'],
            'Recreational Facilities': ['REC-SPORT', 'REC-CULT', 'REC-FIELD'],
            'Special Equipment': ['RES', 'IE', 'AC'],
            'Study Aids': ['LIB', 'REC-CULT', 'ADMIN-SEC'],
            'Software Licenses': ['AC', 'REC-CULT', 'IE', 'ADMIN-FC', 'LIB', 'RES'],
            'Templates & Tools': ['VIRTUAL', 'LIB', 'ADMIN-RECT', 'IE', 'REC-CULT'],
            'Collaboration Spaces': ['VIRTUAL', 'RES-T1', 'RES-T2', 'RES'],
            'Learning Materials': ['LIB', 'ADMIN-SEC', 'RES', 'AC']
        };

        if (detailedFilters.category && detailedFilters.building) {
            const allowedBuildings = categoryBuildingMap[detailedFilters.category];
            if (allowedBuildings && !allowedBuildings.includes(detailedFilters.building)) {
                return `No ${detailedFilters.category} available in the selected building. Try a different building or category.`;
            }
        }
        return null;
    };

    // In ReservationView.js, update the handleDetailedSearch function:

    // In ReservationView.js, in the handleDetailedSearch function, replace the API call section:

    const handleDetailedSearch = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!detailedFilters.date || !detailedFilters.startTime || !detailedFilters.endTime) {
                setError('Please specify date, start time, and end time');
                setShowSearchResults(false);
                setSearchResults({});
                return;
            }

            // Validate times
            if (detailedFilters.startTime < '08:00' || detailedFilters.endTime > '20:00') {
                setError('Reservation times must be between 8:00 AM and 8:00 PM');
                setShowSearchResults(false);
                setSearchResults({});
                return;
            }

            // 🔧 FIX: Create params object from detailedFilters ONLY
            const params = new URLSearchParams();
            params.append('date', detailedFilters.date);
            params.append('startTime', detailedFilters.startTime);
            params.append('endTime', detailedFilters.endTime);
            
            // Only add if they have values
            if (detailedFilters.category) {
                params.append('category', detailedFilters.category);
            }
            if (detailedFilters.building) {
                params.append('building', detailedFilters.building);
            }
            if (detailedFilters.minCapacity) {
                params.append('minCapacity', detailedFilters.minCapacity);
            }

            console.log('🔧 DETAILED SEARCH - Frontend sending params:', {
                date: detailedFilters.date,
                startTime: detailedFilters.startTime,
                endTime: detailedFilters.endTime,
                category: detailedFilters.category,
                building: detailedFilters.building,
                minCapacity: detailedFilters.minCapacity
            });

            const response = await fetch(API_CONFIG.getApiUrl(`/resources?${params.toString()}`));
            
            if (response.ok) {
                const results = await response.json();
                console.log('✅ DETAILED SEARCH - Results received:', results);
                setSearchResults(results);
                setShowSearchResults(true);
            } else {
                setError('Failed to search for available resources');
                setShowSearchResults(false);
                setSearchResults({});
            }
        } catch (error) {
            console.error('Detailed search failed:', error);
            setError('Search failed. Please try again.');
            setShowSearchResults(false);
            setSearchResults({});
        } finally {
            setLoading(false);
        }
    };

    const handleDetailedReserveResource = async (resource, category) => {
        try {
            setLoading(true);
            setError(null);

            const validationError = validateReservationTimes(detailedFilters.startTime, detailedFilters.endTime);
            if (validationError) {
                setError(validationError);
                setLoading(false);
                return;
            }

            const reservationData = {
                userId: currentUser.id,
                resourceType: category,
                resourceName: resource.name,
                date: detailedFilters.date,
                startTime: detailedFilters.startTime,
                endTime: detailedFilters.endTime,
                purpose: 'Detailed search reservation',
                peopleCount: parseInt(detailedFilters.minCapacity) || 1
            };

            const response = await fetch(API_CONFIG.getApiUrl('/reservations'), {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify(reservationData),
            });

            if (response.ok) {
                alert('Reservation created successfully!');
                if (onReservationCreated) onReservationCreated();
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to create reservation');
            }
        } catch (error) {
            console.error('Reservation failed:', error);
            setError('Failed to create reservation');
        } finally {
            setLoading(false);
        }
    };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Study Rooms': return <Monitor className="w-6 h-6" />;
      case 'Computer Labs': return <Laptop className="w-6 h-6" />;
      case 'Equipment': return <Package className="w-6 h-6" />;
      case 'Library Resources': return <BookOpen className="w-6 h-6" />;
      default: return <Users className="w-6 h-6" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header with Back Button */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Reserve Resources</h2>
            <p className="text-gray-600">Choose your preferred reservation method</p>
          </div>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-300"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Method Selection */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => {
              setReservationMethod('quick');
              setShowSearchResults(false);
            }}
            className={`flex-1 p-4 rounded-xl border-2 transition-all duration-300 ${
              reservationMethod === 'quick'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
              <h3 className="font-semibold">Quick Reserve</h3>
            </div>
            <p className="text-sm text-gray-600">See what's available now and reserve instantly</p>
          </button>

          <button
            onClick={() => {
              setReservationMethod('detailed');
              setShowSearchResults(false);
            }}
            className={`flex-1 p-4 rounded-xl border-2 transition-all duration-300 ${
              reservationMethod === 'detailed'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
              <h3 className="font-semibold">Detailed Search</h3>
            </div>
            <p className="text-sm text-gray-600">Specify exact requirements and search</p>
          </button>
        </div>
      </div>

      {/* Quick Reserve Method */}
      {reservationMethod === 'quick' && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border-2 border-indigo-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Reserve - Choose & Book</h3>
          
          {quickReserveStep === 1 ? (
            // Step 1: Time & Category Selection
            <>
              <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-800 mb-3">When do you need it?</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={quickReserveForm.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setQuickReserveForm(prev => ({ 
                        ...prev, 
                        date: e.target.value,
                        startTime: e.target.value === new Date().toISOString().split('T')[0] ? getCurrentMinTime() : '08:00'
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={quickReserveForm.startTime}
                      min={quickReserveForm.date === new Date().toISOString().split('T')[0] ? getCurrentMinTime() : '08:00'}
                      max="19:30"
                      onChange={(e) => setQuickReserveForm(prev => ({ 
                        ...prev, 
                        startTime: e.target.value,
                        endTime: getMinEndTime(e.target.value)
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">8:00 AM - 7:30 PM</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={quickReserveForm.endTime}
                      min={getMinEndTime(quickReserveForm.startTime)}
                      max="20:00"
                      onChange={(e) => setQuickReserveForm(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Until 8:00 PM</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={quickReserveForm.category}
                      onChange={(e) => setQuickReserveForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Choose Category</option>
                      <option value="Study Rooms">Study Rooms</option>
                      <option value="Computer Labs">Computer Labs</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Library Resources">Library Resources</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <Info className="w-4 h-4 inline mr-1" />
                  Reservation duration: {quickReserveForm.startTime && quickReserveForm.endTime ? 
                    (() => {
                      const start = new Date(`2000-01-01T${quickReserveForm.startTime}`);
                      const end = new Date(`2000-01-01T${quickReserveForm.endTime}`);
                      const diffMs = end - start;
                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                      return `${diffHours}h ${diffMins}m`;
                    })() : '0h 0m'
                  }
                </div>
              </div>

              <button
                onClick={handleQuickReserveSearch}
                disabled={!quickReserveForm.date || !quickReserveForm.startTime || !quickReserveForm.endTime || !quickReserveForm.category || loading}
                className="w-full py-3 px-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 font-semibold"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Find Available Resources
                  </>
                )}
              </button>
            </>
          ) : (
            // Step 2: Resource Selection
            <>
              <div className="mb-4 p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">Available {quickReserveForm.category}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(quickReserveForm.date).toLocaleDateString()} • {quickReserveForm.startTime} - {quickReserveForm.endTime}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setQuickReserveStep(1);
                      setQuickAvailableResources([]);
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    ← Change Time/Category
                  </button>
                </div>
              </div>

              {quickAvailableResources.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No resources available for the selected time</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your time or category</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quickAvailableResources.map((resource) => (
                    <div
                      key={resource.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{resource.name}</h5>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Available
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600 mb-3">
                        {resource.location && (
                          <p className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {resource.location}
                          </p>
                        )}
                        {(resource.capacity || resource.computers || resource.quantity) && (
                          <p className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {resource.capacity && `Capacity: ${resource.capacity}`}
                            {resource.computers && `Computers: ${resource.computers}`}
                            {resource.quantity && `Quantity: ${resource.quantity}`}
                          </p>
                        )}
                        {resource.building && (
                          <p className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            Building {resource.building}
                          </p>
                        )}
                        {resource.amenities && resource.amenities.length > 0 && (
                          <p className="text-xs text-gray-500">
                            {resource.amenities.slice(0, 2).join(', ')}
                            {resource.amenities.length > 2 && ` +${resource.amenities.length - 2} more`}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleQuickReserveResource(resource)}
                        disabled={loading}
                        className="w-full py-2 px-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
                      >
                        {loading ? 'Reserving...' : 'Reserve Now'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Detailed Search Method */}
      {reservationMethod === 'detailed' && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Detailed Search & Reserve</h3>
    
            {/* Search Filters */}
            <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={detailedFilters.category}
                            onChange={(e) => setDetailedFilters(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="">All Categories</option>
                            <option value="Study Rooms">Study Rooms</option>
                            <option value="Computer Labs">Computer Labs</option>
                            <option value="Equipment">Equipment</option>
                            <option value="Library Resources">Library Resources</option>
                            <option value="Medical Services">Medical Services</option>
                            <option value="Recreational Facilities">Recreational Facilities</option>
                            <option value="Special Equipment">Special Equipment</option>
                            <option value="Study Aids">Study Aids</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
                        <select
                            value={detailedFilters.building}
                            onChange={(e) => setDetailedFilters(prev => ({ ...prev, building: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="">All Buildings</option>
                            <optgroup label="Academic">
                            <option value="MAIN">Clădirea Centrală UTCN</option>
                            <option value="AC">Facultatea de Automatică și Calculatoare</option>
                            <option value="IE">Facultatea de Inginerie Electrică</option>
                            </optgroup>
                            <optgroup label="Research & Library">
                            <option value="RES">Centrul de Cercetare și Inovare</option>
                            <option value="LIB">Biblioteca Centrală Universitară</option>
                            </optgroup>
                            <optgroup label="Administrative">
                            <option value="ADMIN-RECT">Rectorat UTCN</option>
                            <option value="ADMIN-FC">Decanatul Facultății de Construcții</option>
                            <option value="ADMIN-SEC">Secretariat General</option>
                            </optgroup>
                            <optgroup label="Residential">
                            <option value="RES-T1">Căminul Studențesc T1</option>
                            <option value="RES-T2">Căminul Studențesc T2</option>
                            <option value="RES-OBS">Căminul Studențesc Observator</option>
                            </optgroup>
                            <optgroup label="Recreational">
                            <option value="REC-SPORT">Sala de Sport UTCN</option>
                            <option value="REC-CULT">Centrul Cultural Studențesc</option>
                            <option value="REC-FIELD">Teren de Sport Exterior</option>
                            </optgroup>
                            <optgroup label="Medical">
                            <option value="MED-DISP">Dispensarul Medical UTCN</option>
                            <option value="MED-PSY">Centrul de Sănătate Mentală</option>
                            </optgroup>
                            <optgroup label="Online">
                            <option value="VIRTUAL">Online Resources</option>
                            </optgroup>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                            type="date"
                            value={detailedFilters.date}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setDetailedFilters(prev => ({ 
                            ...prev, 
                            date: e.target.value,
                            startTime: e.target.value === new Date().toISOString().split('T')[0] ? getCurrentMinTime() : '08:00'
                            }))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Capacity</label>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="Any"
                            value={detailedFilters.minCapacity}
                            onChange={(e) => {
                                const value = e.target.value;
                                // Only allow non-negative integers
                                if (value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0)) {
                                    setDetailedFilters(prev => ({ ...prev, minCapacity: value }));
                                }
                            }}
                            onKeyPress={(e) => {
                                // Prevent non-numeric characters and decimal point
                                if (e.key === '-' || e.key === '+' || e.key === '.' || e.key === 'e' || e.key === 'E') {
                                    e.preventDefault();
                                }
                            }}
                            onPaste={(e) => {
                                // Prevent pasting invalid values
                                e.preventDefault();
                                const pastedText = e.clipboardData.getData('text');
                                const num = parseInt(pastedText, 10);
                                if (!isNaN(num) && num >= 0) {
                                    setDetailedFilters(prev => ({ ...prev, minCapacity: num.toString() }));
                                }
                            }}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <input
                            type="time"
                            value={detailedFilters.startTime}
                            min={detailedFilters.date === new Date().toISOString().split('T')[0] ? getCurrentMinTime() : '08:00'}
                            max="19:30"
                            onChange={(e) => setDetailedFilters(prev => ({ 
                            ...prev, 
                            startTime: e.target.value,
                            endTime: e.target.value ? getMinEndTime(e.target.value) : '08:30'
                            }))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">8:00 AM - 7:30 PM</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                        <input
                            type="time"
                            value={detailedFilters.endTime}
                            min={getMinEndTime(detailedFilters.startTime)}
                            max="20:00"
                            onChange={(e) => setDetailedFilters(prev => ({ ...prev, endTime: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Until 8:00 PM</p>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handleDetailedSearch}
                            disabled={!detailedFilters.date || !detailedFilters.startTime || !detailedFilters.endTime || loading}
                            className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-400 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Search className="w-4 h-4" />
                                    Search
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setDetailedFilters({
                                    category: '',
                                    date: new Date().toISOString().split('T')[0],
                                    startTime: '',
                                    endTime: '',
                                    minCapacity: '',
                                    building: ''
                                });
                                setShowSearchResults(false); // Add this line
                                setSearchResults({}); // Add this line
                                setError(null); 
                            }}
                            className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-400 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <Filter className="w-4 h-4" />
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

          {/* Search Results */}
            {showSearchResults && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-4">Search Results</h4>
                
                {!searchResults.resources || Object.keys(searchResults.resources).length === 0 ? (
                <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No resources available for the selected criteria</p>
                    <p className="text-sm text-gray-500 mt-1">Try adjusting your search filters</p>
                </div>
                ) : (
                <div className="space-y-6">
                    {Object.entries(searchResults.resources).map(([category, resources]) => (
                    <div key={category}>
                        <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                        {getCategoryIcon(category)}
                        {category} ({resources.length} available)
                        </h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {resources.map((resource) => (
                            <div
                            key={resource.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                            <div className="flex justify-between items-start mb-2">
                                <h6 className="font-medium text-gray-900">{resource.name}</h6>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                Available
                                </span>
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600 mb-3">
                                {resource.location && (
                                <p className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {resource.location}
                                </p>
                                )}
                                {(resource.capacity || resource.computers || resource.quantity) && (
                                <p className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {resource.capacity && `Capacity: ${resource.capacity}`}
                                    {resource.computers && `Computers: ${resource.computers}`}
                                    {resource.quantity && `Quantity: ${resource.quantity}`}
                                </p>
                                )}
                                {resource.buildingName && (
                                <p className="flex items-center gap-1">
                                    <Building className="w-3 h-3" />
                                    {resource.buildingName}
                                </p>
                                )}
                                {resource.amenities && resource.amenities.length > 0 && (
                                <p className="text-xs text-gray-500">
                                    {resource.amenities.slice(0, 2).join(', ')}
                                    {resource.amenities.length > 2 && ` +${resource.amenities.length - 2} more`}
                                </p>
                                )}
                            </div>

                            <button
                                onClick={() => handleDetailedReserveResource(resource, category)}
                                disabled={loading}
                                className="w-full py-2 px-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
                            >
                                {loading ? 'Reserving...' : 'Reserve Now'}
                            </button>
                            </div>
                        ))}
                        </div>
                    </div>
                    ))}
                </div>
                )}
            </div>
            )}
          {/* Errors & Info Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{error}</span>
                <button 
                    onClick={() => setError(null)}
                    className="ml-auto text-red-600 hover:text-red-800"
                >
                    ×
                </button>
                </div>
            )}
            {/* Time Selection Guidance */}
            {!error && (!detailedFilters.date || !detailedFilters.startTime || !detailedFilters.endTime) && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800">
                Please select a <strong>date</strong>, <strong>start time</strong>, and <strong>end time</strong> to see available resources.
                </span>
            </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ReservationView;