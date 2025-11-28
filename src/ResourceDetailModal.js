import ClujUniversityMapsService from './clujUniversityMapsService';

import React, { useState, useEffect } from 'react';
import { 
  X, MapPin, Users, Star, Calendar, Clock, Wifi, Monitor, 
  Projector, Coffee, Printer, Mic, Camera, Heart, ChevronLeft, 
  ChevronRight, CheckCircle, AlertCircle, User, Navigation, Map,
  ExternalLink, Smartphone, Bus, Car, ParkingCircle, Phone, Globe, Info
} from 'lucide-react';
import { API_CONFIG } from './config.js';

const ResourceDetailModal = ({ 
    isOpen, 
    onClose, 
    resource, 
    category, 
    onReserve,
    currentUser 
}) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [availability, setAvailability] = useState({});
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [showMapOptions, setShowMapOptions] = useState(false);
    const [showTransportInfo, setShowTransportInfo] = useState(false);
    const [locationInfo, setLocationInfo] = useState(null);
    const [buildingDetails, setBuildingDetails] = useState(null);
    const [transportInfo, setTransportInfo] = useState(null);
    const [parkingInfo, setParkingInfo] = useState(null);
    const [directionsInfo, setDirectionsInfo] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [showLocationDetails, setShowLocationDetails] = useState(false);
    const [locationData, setLocationData] = useState(null);
    const [isPhysicalLocation, setIsPhysicalLocation] = useState(false);
    
  // Enhanced reservation form state
  const [reservationForm, setReservationForm] = useState({
    purpose: 'Study Session',
    peopleCount: 1,
    specialRequests: '',
    startTime: '',
    endTime: '',
    duration: 1
  });

  // Maps integration functions
    const getLocationCoordinates = (location) => {
        return ClujUniversityMapsService.getLocationCoordinates(location);    
    }

    const openInAppleMaps = () => {
        if (!locationData || !isPhysicalLocation) {
            alert('This is a digital resource - no location required');
            return;    
        }
        const query = encodeURIComponent(locationData.address);
        const url = `http://maps.apple.com/?q=${query}`;
        window.open(url, '_blank');
    };

    const getDirections = () => {
        if (!locationData || !isPhysicalLocation) {
            alert('This is a digital resource - no location required');
            return; 
        }
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const origin = `${latitude}, ${longitude}`;
                    const destination = `${locationData.lat},${locationData.lng}`;
                    const url = `https://www.google.com/maps/dir/${origin}/${destination}`;
                    window.open(url, '_blank');
                },
                () => {
                    const query = encodeURIComponent(locationData.address);
                    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
                    window.open(url, '_blank');
                }
            );
        } else {
            const query = encodeURIComponent(locationData.address);;
            const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
            window.open(url, '_blank'); 
        }
    };

    const shareLocation = async () => {
        if (!locationData || !isPhysicalLocation) {
            alert('This is a digital resource - no location required');
            return; 
        }
        const shareData = {
            title: `Location for ${resource.name}`,
            text: `${resource.name} found at location ${locationData.address}`,
            url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationData.address)}`
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                console.log('Sharing canceled');
            }
        } else {
            try {
                await navigator.clipboard.writeText(`${resource.name}: ${locationData.address}\n${shareData.url}`);
                alert('Location details have been copied to the clipboard!')
            } catch (error) {
                console.error('Error copying to clipboard');
            }
        }
    };

    const initializeLocationData = async () => {
        if (resource && resource.location) {
            try {
                const locationCoordinates = await getLocationCoordinates(resource.location);
                setLocationData(locationCoordinates);
                
                // Check if it's a physical location
                const isPhysical = resource.location && 
                    !resource.location.toLowerCase().includes('online') &&
                    !resource.location.toLowerCase().includes('virtual') &&
                    !resource.location.toLowerCase().includes('remote');
                
                setIsPhysicalLocation(isPhysical);
            } catch (error) {
                console.error('Error getting location data:', error);
                setLocationData(null);
                setIsPhysicalLocation(false);
            }
        } else {
            // No location specified - assume it's virtual/online
            setLocationData(null);
            setIsPhysicalLocation(false);
        }
    };

    // Enhanced date and time validation function
    const validateDateTime = (date, startTime, endTime) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    // Check if date is in the past
    if (date < today) {
        return `Cannot make reservations for past dates`;
    }

    // Check if time is in the past (for today's reservations)
    if (date === today && startTime && startTime <= currentTime) {
        return `Cannot make reservations for past times. Current time: ${currentTime}`;
    }

    // Check if end time is after start time
    if (startTime && endTime && startTime >= endTime) {
        return 'End time must be after start time';
    }

    // Check minimum duration (30 minutes)
    if (startTime && endTime) {
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        const diffMinutes = (end - start) / (1000 * 60);
        
        if (diffMinutes < 30) {
        return 'Reservation must be at least 30 minutes long';
        }

        if (diffMinutes > 480) { // 8 hours
        return 'Reservation cannot be longer than 8 hours';
        }
    }

    return null;
    };

  // Mock images - in real app, these would come from the database
    const getResourceImages = (resource, category) => {
  // Base image sources with high-quality free images
        const imageMap = {
            'Study Rooms': [
                'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center', // Modern study room
                'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=400&h=300&fit=crop&crop=center', // Bright study space
                'https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=400&h=300&fit=crop&crop=center'  // Cozy study area
            ],
            'Computer Labs': [
                'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop&crop=center', // Computer setup
                'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=300&fit=crop&crop=center', // Tech workspace
                'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center'  // Modern lab
            ],
            'Library Resources': [
                'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=300&fit=crop&crop=center', // Modern library
                'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center', // Library interior
                'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=300&fit=crop&crop=center'  // Reading area
            ],
            'Equipment': [
                'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop&crop=center', // Tech equipment
                'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center', // Professional setup
                'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop&crop=center' // Equipment room
            ],
            'Collaboration Spaces': [
                'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop&crop=center', // Meeting room
                'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=300&fit=crop&crop=center', // Collaboration area
                'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=400&h=300&fit=crop&crop=center'  // Team workspace
            ],
            'Software Licenses': [
                'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop&crop=center', // Software interface
                'https://images.unsplash.com/photo-1484807352052-23338990c6c6?w=400&h=300&fit=crop&crop=center', // Computer screen
                'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=300&fit=crop&crop=center'  // Development setup
            ],
            'Learning Materials': [
                'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop&crop=center', // Educational materials
                'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop&crop=center', // Learning environment
                'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop&crop=center'  // Study materials
            ],
            'Special Equipment': [
                'https://images.unsplash.com/photo-1567789884554-0b844b597180?w=400&h=300&fit=crop&crop=center', // 3D printer
                'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop&crop=center', // Technical equipment
                'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop&crop=center'  // Innovation lab
            ]
        };

         // Return images for the category, or default images if category not found
    return imageMap[category] || [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=400&h=300&fit=crop'
        ];
    };

    const resourceImages = getResourceImages(resource, category);

    const purposes = [
        'Study Session',
        'Group Project',
        'Meeting',
        'Presentation',
        'Research',
        'Workshop',
        'Training',
        'Exam Preparation',
        'Other'
    ];

    const timeSlots = [
        '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
        '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
    ];


    useEffect(() => {
        if (resource?.location) {
            // Get location coordinates and determine if it's a physical location
            const initializeLocationData = async () => {
                try {
                    const coordinates = await ClujUniversityMapsService.getLocationCoordinates(resource.location);
                    setLocationData(coordinates);
                    // Determine if this is a physical location
                    const isPhysical = coordinates && coordinates.lat && coordinates.lng && 
                                    !resource.location.toLowerCase().includes('online') &&
                                    !resource.location.toLowerCase().includes('virtual') &&
                                    !resource.location.toLowerCase().includes('remote');
                
                    setIsPhysicalLocation(isPhysical);
                } catch (error) {
                    console.error('Error getting location data:', error);
                    setLocationData(null);
                    setIsPhysicalLocation(false);
                }
            };
            initializeLocationData();
        } else {
            // No location specified - assume it's virtual/online
            setLocationData(null);
            setIsPhysicalLocation(false);
        }
    }, [resource?.location]);

    // Load location info
    useEffect(() => {
        if (isOpen && resource && resource.location) {
            loadEnhancedLocationInfo();
        }
    }, [isOpen, resource]);
  // Fetch availability when date or resource changes
    useEffect(() => {
        if (isOpen && resource) {
        fetchAvailability();
        }
    }, [isOpen, resource, selectedDate]);

    // Prevent background scroll when modal is open
    useEffect(() => {
        if (isOpen) {
        // Disable body scroll and add modal class
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.classList.add('modal-open');
        } else {
        // Re-enable body scroll and remove modal class
        document.body.style.overflow = 'unset';
        document.body.style.position = 'unset';
        document.body.style.width = 'unset';
        document.body.style.height = 'unset';
        document.body.classList.remove('modal-open');
        }

        // Cleanup function to restore scroll when component unmounts
        return () => {
        document.body.style.overflow = 'unset';
        document.body.style.position = 'unset';
        document.body.style.width = 'unset';
        document.body.style.height = 'unset';
        document.body.classList.remove('modal-open');
        };
    }, [isOpen]);

    // Handle Escape key to close modal
    useEffect(() => {
        const handleEscape = (event) => {
        if (event.key === 'Escape' && isOpen) {
            handleClose();
        }
        };

        if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen]);

    const fetchAvailability = async () => {
        setLoadingAvailability(true);
        try {
        const response = await fetch(API_CONFIG.getApiUrl(`/resources/${category}/${resource.id}?date=${selectedDate}`));
        const data = await response.json();
        
        if (response.ok) {
            setAvailability(data.resource.availability || {});
        }
        } catch (error) {
        console.error('Error fetching availability:', error);
        } finally {
        setLoadingAvailability(false);
        }
    };

    const getAmenityIcon = (amenity) => {
        const iconMap = {
        'Whiteboard': '📝',
        'Projector': '📽️',
        'Computer': '💻',
        'Video Conference': '📹',
        'Wifi': '📶',
        'AC': '❄️',
        'Natural Light': '☀️',
        'Power Outlets': '🔌',
        'Audio System': '🔊',
        'Quiet Zone': '🔇',
        'High-spec PCs': '⚡',
        'Graphics Workstations': '🎨',
        'Development Software': '⚙️',
        'Design Software': '🎯',
        '4K Recording': '📸',
        'Wireless': '📡',
        'Touch Interface': '👆',
        'Multiple Monitors': '🖥️'
        };
        return iconMap[amenity] || '✨';
    };

    const generateEndTimeOptions = (startTime) => {
        if (!startTime) return [];
        const startHour = parseInt(startTime.split(':')[0]);
        const endOptions = [];
        for (let hour = startHour + 1; hour <= Math.min(startHour + 8, 22); hour++) {
        endOptions.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        return endOptions;
    };

    const isTimeSlotAvailable = (time) => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().slice(0, 5);

        if (selectedDate === today && time <= currentTime) {
            return false;
        }

        const dateAvailability = availability[selectedDate];
        if (!dateAvailability) return true;
        
        return !dateAvailability.bookings.some(booking => 
        time >= booking.start_time && time < booking.end_time
        );
    };

    const handleReservation = async () => {
        if (!selectedTimeSlot || !reservationForm.endTime) {
        alert('Please select start and end times');
        return;
        }

        if (!reservationForm.peopleCount || reservationForm.peopleCount < 1) {
        alert('Please enter a valid number of people');
        return;
        }

        const maxCapacity = resource.capacity || resource.computers || resource.maxUsers || 20;
        if (parseInt(reservationForm.peopleCount) > maxCapacity) {
        alert(`Maximum capacity is ${maxCapacity} people`);
        return;
        }

        const reservationData = {
        userId: currentUser.id,
        resourceType: category,
        resourceName: resource.name,
        date: selectedDate,
        startTime: selectedTimeSlot,
        endTime: reservationForm.endTime,
        purpose: reservationForm.purpose,
        peopleCount: parseInt(reservationForm.peopleCount),
        specialRequests: reservationForm.specialRequests
        };

        try {
        const response = await fetch(API_CONFIG.getApiUrl('/reservations'), {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(reservationData),
        });

        const result = await response.json();

        if (response.ok) {
            alert('Reservation created successfully!');
            onReserve && onReserve(result);
            onClose();
            
            // Reset form
            setSelectedTimeSlot(null);
            setReservationForm({
            purpose: 'Study Session',
            peopleCount: 1,
            specialRequests: '',
            startTime: '',
            endTime: '',
            duration: 1
            });
        } else {
            alert(result.error || 'Failed to create reservation');
        }
        } catch (error) {
        console.error('Reservation error:', error);
        alert('Failed to create reservation');
        }
    };

    const handleClose = () => {
        // Reset form when closing
        setSelectedTimeSlot(null);
        setReservationForm({
        purpose: 'Study Session',
        peopleCount: 1,
        specialRequests: '',
        startTime: '',
        endTime: '',
        duration: 1
        });
        setCurrentImageIndex(0);
        setShowMapOptions(false);
        setShowTransportInfo(false);
        
        // Ensure body styles are reset
        document.body.style.overflow = 'unset';
        document.body.style.position = 'unset';
        document.body.style.width = 'unset';
        document.body.style.height = 'unset';
        document.body.classList.remove('modal-open');
        
        onClose();
    };

    const toggleFavorite = async () => {
        // This would call an API to add/remove from favorites
        setIsFavorite(!isFavorite);
        // TODO: Implement API call to manage favorites
    };

    if (!isOpen || !resource) return null;

    const loadEnhancedLocationInfo = async () => {
        if (!resource.location) return;
        setLoadingLocation(true);
        try {
            console.log('🗺️ Loading location info for:', resource.location);
            // Get basic location coordinates (with building detection)
            const location = await ClujUniversityMapsService.getLocationCoordinates(resource.location);
            setLocationInfo(location);   
            // If we have a building code, load detailed info
            if (location.buildingCode) {
                console.log('🏢 Loading building details for:', location.buildingCode);
                // Load building details, transport, and parking in parallel
                const [buildingData, transportData, parkingData] = await Promise.allSettled([
                ClujUniversityMapsService.getBuildingDetails(location.buildingCode),
                ClujUniversityMapsService.getTransportInfo(location.buildingCode, true),
                ClujUniversityMapsService.getParkingInfo(location.buildingCode)
                ]);
                
                if (buildingData.status === 'fulfilled') {
                setBuildingDetails(buildingData.value);
                console.log('✅ Building details loaded');
                }
                
                if (transportData.status === 'fulfilled') {
                setTransportInfo(transportData.value);
                console.log('✅ Transport info loaded');
                }
                
                if (parkingData.status === 'fulfilled') {
                setParkingInfo(parkingData.value);
                console.log('✅ Parking info loaded');
                }
            } 
        } catch (error) {
            console.error('❌ Error loading location info:', error);
        } finally {
            setLoadingLocation(false);
        }
    };

    // NEW: Get directions from main campus
    const getDirectionsFromMainCampus = async () => {
        if (!locationInfo?.buildingCode) return;
        
        try {
        const directions = await ClujUniversityMapsService.getDirections('MAIN', locationInfo.buildingCode, 'walking');
        setDirectionsInfo(directions);
        } catch (error) {
        console.error('Error getting directions:', error);
        }
    };

    // NEW: Open in Google Maps
    const openInGoogleMaps = () => {
        if (locationInfo) {
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${locationInfo.lat},${locationInfo.lng}`;
        window.open(googleMapsUrl, '_blank');
        }
    };

  // NEW: Enhanced location display component
    const EnhancedLocationDisplay = () => {
        if (!locationInfo) return null;

        return (
            <div className="space-y-4">
                {/* Basic Location Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                <h4 className="font-medium text-blue-800">Location</h4>
                                {loadingLocation && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                )}
                            </div>
                            <p className="text-blue-700 text-sm mb-2">{locationInfo.address}</p>
                    
                            {buildingDetails && (
                                <div className="space-y-1">
                                    <p className="text-blue-800 font-medium">{buildingDetails.name}</p>
                                    {buildingDetails.floors && (
                                        <p className="text-blue-600 text-sm">{buildingDetails.floors} floors • Capacity: {buildingDetails.capacity}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    
                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 ml-4">
                        <button
                            onClick={openInGoogleMaps}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                        >
                            <ExternalLink className="w-3 h-3" />
                            Maps
                        </button>
                    
                        <button
                            onClick={() => setShowLocationDetails(!showLocationDetails)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs"
                        >
                            <Info className="w-3 h-3" />
                            {showLocationDetails ? 'Less' : 'More'}
                        </button>
                    </div>
                </div>

                {/* Quick Access Info */}
                {buildingDetails?.opening_hours && (
                    <div className="mt-3 p-2 bg-blue-100 rounded">
                        <p className="text-xs text-blue-700">
                            📅 Open: {buildingDetails.opening_hours.weekdays || 'Contact for hours'}
                        </p>
                    </div>
                )}
                </div>

                {/* Detailed Location Information */}
                {showLocationDetails && (
                    <div className="space-y-4 animate-fadeIn">
                        {/* Building Amenities */}
                        {buildingDetails?.amenities && Object.keys(buildingDetails.amenities).length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                                    <Monitor className="w-4 h-4" />
                                    Building Amenities
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(buildingDetails.amenities).map(([amenity, available]) => 
                                        available && (
                                            <span key={amenity} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                                {amenity.replace('_', ' ')}
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Transport Options */}
                        {transportInfo?.available_transport && Object.keys(transportInfo.available_transport).length > 0 && (
                            <div className="bg-green-50 rounded-lg p-4">
                                <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                                    <Bus className="w-4 h-4 text-green-600" />
                                    Public Transport
                                </h5>
                                
                                {Object.entries(transportInfo.available_transport).map(([type, routes]) => (
                                    <div key={type} className="mb-3">
                                        <p className="text-sm font-medium text-gray-700 mb-1 capitalize">{type}:</p>
                                        <div className="space-y-1">
                                            {routes.slice(0, 3).map((route, index) => (
                                                <div key={index} className="flex items-center justify-between text-xs">
                                                    <span className="text-green-700">
                                                        🚌 {route.route_number} - {route.route_name}
                                                    </span>
                                                    <span className="text-green-600">
                                                        {route.walking_time_minutes}min walk
                                                    </span>
                                                </div>
                                            ))}
                                            {routes.length > 3 && (
                                                <p className="text-xs text-green-600">+{routes.length - 3} more routes</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                {transportInfo.general_info?.ticket_prices && (
                                    <div className="mt-3 p-2 bg-green-100 rounded">
                                        <p className="text-xs text-green-700">
                                            🎫 Student pass: {transportInfo.general_info.ticket_prices.monthly_student}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Parking Options */}
                        {parkingInfo?.parking_areas && parkingInfo.parking_areas.length > 0 && (
                                <div className="bg-orange-50 rounded-lg p-4">
                                    <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                                        <ParkingCircle className="w-4 h-4 text-orange-600" />
                                        Nearby Parking
                                    </h5>
                                
                                <div className="space-y-2">
                                    {parkingInfo.parking_areas.slice(0, 3).map((parking, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-700">{parking.name}</p>
                                                <p className="text-xs text-gray-600">
                                                    {parking.capacity.total_spaces} spaces • {parking.distance.walking_time_minutes}min walk
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-orange-700 font-medium">
                                                    {parking.pricing.type === 'free' ? 'Free' : 
                                                    parking.pricing.type === 'permit_only' ? 'Permit' :
                                                    `${parking.pricing.hourly_rate} RON/h`}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                
                                    {parkingInfo.summary && (
                                        <div className="mt-2 p-2 bg-orange-100 rounded">
                                            <p className="text-xs text-orange-700">
                                                📊 {parkingInfo.summary.total_spaces} total spaces nearby
                                                {parkingInfo.summary.free_parking_available && ' • Free parking available'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Contact Information */}
                        {buildingDetails?.contact_info && (
                            <div className="bg-purple-50 rounded-lg p-4">
                                <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-purple-600" />
                                    Contact Information
                                </h5>
                                <div className="space-y-1">
                                    {buildingDetails.contact_info.phone && (
                                        <p className="text-sm text-purple-700">
                                        📞 {buildingDetails.contact_info.phone}
                                        </p>
                                    )}
                                    {buildingDetails.contact_info.email && (
                                        <p className="text-sm text-purple-700">
                                            📧 {buildingDetails.contact_info.email}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Accessibility Information */}
                        {buildingDetails?.accessibility_features && Object.keys(buildingDetails.accessibility_features).length > 0 && (
                            <div className="bg-teal-50 rounded-lg p-4">
                                <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-teal-600" />
                                    Accessibility
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(buildingDetails.accessibility_features).map(([feature, available]) => 
                                        available && (
                                            <span key={feature} className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs">
                                                ♿ {feature.replace('_', ' ')}
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Quick Directions */}
                        <div className="bg-indigo-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <h5 className="font-medium text-gray-800 flex items-center gap-2">
                                <Navigation className="w-4 h-4 text-indigo-600" />
                                Quick Directions
                                </h5>
                                <button
                                onClick={getDirectionsFromMainCampus}
                                className="text-indigo-600 hover:text-indigo-800 text-xs underline"
                                >
                                From Main Campus
                                </button>
                            </div>
                        
                            {directionsInfo && (
                                <div className="mt-2 p-2 bg-indigo-100 rounded">
                                    <p className="text-xs text-indigo-700">
                                        🚶 {directionsInfo.estimated_time_minutes} minutes walk 
                                        ({directionsInfo.distance_km} km) from main campus
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div 
            className="modal-overlay fixed inset-0 bg-black bg-opacity-80 flex items-start justify-center overflow-y-auto"
            onClick={handleClose}
            style={{ 
                overscrollBehavior: 'contain',
                touchAction: 'none',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 9999
            }}
        >
            <div 
                className="modal-content bg-white rounded-2xl max-w-4xl w-full mx-4 my-8 shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
                style={{ 
                    maxHeight: 'calc(100vh - 4rem)',
                    overflowY: 'auto',
                    overscrollBehavior: 'contain',
                    minHeight: '500px',
                    zIndex: 10000
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-gray-800">{resource.name}</h2>
                        <button
                            onClick={() => setIsFavorite(!isFavorite)}
                            className={`p-2 rounded-full transition-colors ${
                                isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500'
                            }`}
                        >
                            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Images and Info */}
                        <div>
                            {/* Image Gallery - FORCED SMALL SIZE */}
                            <div className="relative mb-4" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <div 
                                    className="rounded-lg overflow-hidden bg-gray-200 border border-gray-200"
                                    style={{ 
                                        width: '280px',     // Explicit width
                                        height: '180px',    // Explicit height  
                                        maxWidth: '280px',  // Force maximum
                                        maxHeight: '180px', // Force maximum
                                        minWidth: '280px',  // Force minimum
                                        minHeight: '180px',  // Force minimum
                                        position: 'relative'
                                    }}
                                >
                                <img
                                    src={resourceImages[currentImageIndex]}
                                    alt={`${resource.name} view ${currentImageIndex + 1}`}
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover',
                                        display: 'block'
                                    }}
                                />
                            </div>
                            <EnhancedLocationDisplay />
                            {/* Navigation buttons */}
                            {resourceImages.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                                        disabled={currentImageIndex === 0}
                                        style={{
                                            position: 'absolute',
                                            left: '8px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '32px',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            zIndex: 20,
                                            opacity: currentImageIndex === 0 ? 0.5 : 1
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={() => setCurrentImageIndex(Math.min(resourceImages.length - 1, currentImageIndex + 1))}
                                        disabled={currentImageIndex === resourceImages.length - 1}
                                        style={{
                                            position: 'absolute',
                                            right: '8px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '32px',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            zIndex: 20,
                                            opacity: currentImageIndex === resourceImages.length - 1 ? 0.5 : 1
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                            
                                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1" style={{ zIndex: 10 }}>
                                        {resourceImages.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentImageIndex(index)}
                                                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                                    index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-60'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Resource Details */}
                        <div className="space-y-4 mt-6">
                            {!locationInfo && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin className="w-5 h-5" />
                                    <span>{resource.location || 'Location not specified'}</span>
                                </div>    
                            )}

                            <div className="flex items-center gap-2 text-gray-600">
                                <Users className="w-5 h-5" />
                                <span>Capacity: {resource.capacity || resource.computers || resource.quantity || 1} people</span>
                            </div>

                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-blue-800">
                                        <MapPin className="w-5 h-5" />
                                        <span className="font-medium">Locația</span>
                                    </div>
                                    {isPhysicalLocation && (
                                        <button
                                            onClick={() => setShowMapOptions(!showMapOptions)}
                                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                                        >
                                            <Navigation className="w-4 h-4" />
                                            Direcții
                                        </button>
                                    )}
                                </div>
                            
                                <p className="text-blue-700 mb-3">
                                    {resource.location || 'Location is not specified'}
                                </p>
                            
                                {locationData && locationData.address && (
                                    <p className="text-sm text-blue-600 mb-3">
                                        📍 {locationData.address}
                                    </p>
                                )}

                                {/* Maps Options */}
                                {showMapOptions && isPhysicalLocation && (
                                    <div className="space-y-3 pt-3 border-t border-blue-200">
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={getDirections}
                                                className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors text-sm"
                                            >
                                                <Navigation className="w-4 h-4" />
                                                Direcții
                                            </button>
                                    
                                            <button
                                                onClick={openInGoogleMaps}
                                                className="flex items-center justify-center gap-2 bg-white border border-blue-300 text-blue-600 py-2 px-3 rounded-md hover:bg-blue-50 transition-colors text-sm"
                                            >       
                                                <ExternalLink className="w-4 h-4" />
                                                Google Maps
                                            </button>
                                    
                                            <button
                                                onClick={shareLocation}
                                                className="flex items-center justify-center gap-2 bg-white border border-blue-300 text-blue-600 py-2 px-3 rounded-md hover:bg-blue-50 transition-colors text-sm"
                                            >
                                                <Map className="w-4 h-4" />
                                                Share Location
                                            </button>
                                    
                                            <button
                                                onClick={() => setShowTransportInfo(!showTransportInfo)}
                                                className="flex items-center justify-center gap-2 bg-white border border-blue-300 text-blue-600 py-2 px-3 rounded-md hover:bg-blue-50 transition-colors text-sm"
                                            >
                                                <Bus className="w-4 h-4" />
                                                Transport
                                            </button>
                                        </div>
                                
                                        {/* Transport Information */}
                                        {showTransportInfo && transportInfo && (
                                            <div className="bg-white rounded-lg p-3 border border-blue-200">
                                                <h5 className="font-medium text-blue-800 mb-2">Transport Public</h5>
                                                <div className="text-sm text-blue-700 space-y-1">
                                                    <p><strong>Linii disponibile:</strong> {transportInfo.availableRoutes.join(', ')}</p>
                                                    <p><strong>Preț bilet:</strong> {transportInfo.ticketPrice}</p>
                                                    <p><strong>Abonament student:</strong> {transportInfo.monthlyPass}</p>
                                                    <p><strong>App mobil:</strong> {transportInfo.mobileApp}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!isPhysicalLocation && (
                                    <div className="flex items-center gap-2 text-blue-600 text-sm">
                                        <Monitor className="w-4 h-4" />
                                        <span>Resursă Virtuală/Online - Fără Locație Fizică</span>
                                    </div>
                                )}
                            </div>

                            {resource.description && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium text-gray-800 mb-2">Description</h4>
                                    <p className="text-gray-600">{resource.description}</p>
                                </div>
                            )}

                            {/* Amenities */}
                            {resource.amenities && resource.amenities.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-800 mb-3">Amenities</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {resource.amenities.map((amenity, index) => (
                                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                                <span className="text-lg">{getAmenityIcon(amenity)}</span>
                                                <span className="text-sm text-gray-700">{amenity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        </div>

                        {/* Right Column - Reservation Form */}
                        <div>
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="text-xl font-semibold text-gray-800 mb-6">Make a Reservation</h3>
                                {/* Date Selection */}
                                <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    // Reset selected time slot when date changes
                                    setSelectedTimeSlot(null);
                                    setReservationForm({...reservationForm, startTime: '', endTime: ''});
                                    
                                    // Clear validation error when date changes
                                    setValidationError('');
                                    }}
                                    min={new Date().toISOString().split('T')[0]}
                                    max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Max 1 year ahead
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {selectedDate === new Date().toISOString().split('T')[0] && (
                                    <p className="text-xs text-blue-600 mt-1">
                                    ℹ️ Only future time slots are available for today
                                    </p>
                                )}
                                </div>

                                {/* Time Slot Selection */}
                                <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots</label>
                                {loadingAvailability ? (
                                    <div className="text-center py-4">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                    <p className="text-sm text-gray-500 mt-2">Loading availability...</p>
                                    </div>
                                ) : (
                                    <>
                                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-md">
                                        {timeSlots.map((time) => {
                                        const isAvailable = isTimeSlotAvailable(time);
                                        const isSelected = selectedTimeSlot === time;
                                        
                                        // Check if time is in the past for today
                                        const today = new Date().toISOString().split('T')[0];
                                        const currentTime = new Date().toTimeString().slice(0, 5);
                                        const isPastTime = selectedDate === today && time <= currentTime;
                                        
                                        return (
                                            <button
                                            key={time}
                                            type="button"
                                            onClick={() => {
                                                if (isAvailable && !isPastTime) {
                                                setSelectedTimeSlot(time);
                                                setReservationForm({...reservationForm, startTime: time, endTime: ''});
                                                }
                                            }}
                                            disabled={!isAvailable || isPastTime}
                                            className={`p-3 text-sm rounded-md transition-colors font-medium relative ${
                                                isSelected
                                                ? 'bg-indigo-600 text-white'
                                                : isAvailable && !isPastTime
                                                ? 'bg-white border border-gray-300 hover:border-indigo-300 text-gray-700 hover:bg-indigo-50'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                            title={
                                                isPastTime ? 'Time has passed' : 
                                                !isAvailable ? 'Already booked' : 
                                                'Available'
                                            }
                                            >
                                            <div className="text-center">
                                                <div>{time}</div>
                                                {isPastTime && selectedDate === today && (
                                                <div className="text-xs text-red-400 font-normal">Past</div>
                                                )}
                                                {!isAvailable && !isPastTime && (
                                                <div className="text-xs text-gray-400 font-normal">Booked</div>
                                                )}
                                            </div>
                                            </button>
                                        );
                                        })}
                                    </div>
                                    
                                    {/* Helper text for today's reservations */}
                                    {selectedDate === new Date().toISOString().split('T')[0] && (
                                        <p className="text-xs text-blue-600 mt-2 text-center">
                                        ℹ️ Past time slots for today are automatically hidden
                                        </p>
                                    )}
                                    </>
                                )}
                                </div>

                                {/* End Time Selection */}
                                {selectedTimeSlot && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                                    <select
                                    value={reservationForm.endTime}
                                    onChange={(e) => {
                                        const newEndTime = e.target.value;
                                        setReservationForm({...reservationForm, endTime: newEndTime});
                                        
                                        // Validate the selection
                                        const validationError = validateDateTime(selectedDate, selectedTimeSlot, newEndTime);
                                        setValidationError(validationError || '');
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                    >
                                    <option value="">Select end time</option>
                                    {generateEndTimeOptions(selectedTimeSlot).map((time) => {
                                        // Additional check to ensure end time is not in the past for today
                                        const today = new Date().toISOString().split('T')[0];
                                        const currentTime = new Date().toTimeString().slice(0, 5);
                                        const isPastEndTime = selectedDate === today && time <= currentTime;
                                        
                                        return (
                                        <option 
                                            key={time} 
                                            value={time}
                                            disabled={isPastEndTime}
                                        >
                                            {time} {isPastEndTime ? '(Past)' : ''}
                                        </option>
                                        );
                                    })}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                    Minimum duration: 30 minutes • Maximum: 8 hours
                                    </p>
                                </div>
                                )}

                                {/* Purpose Selection */}
                                <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
                                <select
                                    value={reservationForm.purpose}
                                    onChange={(e) => setReservationForm({...reservationForm, purpose: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                >
                                    {purposes.map((purpose) => (
                                    <option key={purpose} value={purpose}>{purpose}</option>
                                    ))}
                                </select>
                                </div>

                                {/* Number of People */}
                                <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Number of People</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={resource.capacity || 20}
                                    value={reservationForm.peopleCount}
                                    onChange={(e) => setReservationForm({...reservationForm, peopleCount: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Maximum capacity: {resource.capacity || 20}</p>
                                </div>

                                {/* Special Requests */}
                                <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
                                <textarea
                                    rows={3}
                                    placeholder="Any special requirements or requests..."
                                    value={reservationForm.specialRequests}
                                    onChange={(e) => setReservationForm({...reservationForm, specialRequests: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                />
                                </div>
                                
                                {/* Validation Error Display */}
                                {validationError && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4">
                                        <div className="flex items-start gap-2">
                                            <span className="text-red-500 font-bold">⚠️</span>
                                            <span className="text-sm">{validationError}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Reservation Summary */}
                                {selectedTimeSlot && reservationForm.endTime && (
                                <div className="bg-indigo-50 p-4 rounded-lg mb-4">
                                    <h4 className="font-medium text-indigo-800 mb-2">Reservation Summary</h4>
                                    <div className="text-sm text-indigo-700 space-y-1">
                                    <p>📅 {new Date(selectedDate).toLocaleDateString()}</p>
                                    <p>⏰ {selectedTimeSlot} - {reservationForm.endTime}</p>
                                    <p>👥 {reservationForm.peopleCount} people</p>
                                    <p>🎯 {reservationForm.purpose}</p>
                                    </div>
                                </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                <button
                                    onClick={handleReservation}
                                    disabled={!selectedTimeSlot || !reservationForm.endTime || validationError}
                                    className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    Reserve Now
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* ADD: Custom CSS for animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
        
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default ResourceDetailModal;