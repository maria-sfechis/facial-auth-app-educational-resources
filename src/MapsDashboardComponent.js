import React, { useState, useEffect } from 'react';
import { 
    Map, Navigation, Clock, Bus, ParkingCircle, Building2, 
    Route, MapPin, Search, Filter, RefreshCw, AlertCircle,
    ExternalLink, Phone, Info, ChevronRight, Star, Zap,
    Users, Coffee, Wifi, Monitor, Eye, EyeOff
} from 'lucide-react';
import ClujUniversityMapsService from './clujUniversityMapsService';
import BuildingSelectorComponent from './BuildingSelectorComponent';

const MapsDashboardComponent = ({ 
    currentUser, 
    onResourceSelect,
    initialBuilding = null 
}) => {
    const [activeView, setActiveView] = useState('overview'); // overview, navigation, transport, parking
    const [selectedBuilding, setSelectedBuilding] = useState(initialBuilding);
    const [buildingDetails, setBuildingDetails] = useState(null);
    const [transportInfo, setTransportInfo] = useState(null);
    const [parkingInfo, setParkingInfo] = useState(null);
    const [directionsInfo, setDirectionsInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showRealTimeData, setShowRealTimeData] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [recentBuildings, setRecentBuildings] = useState([]);

    // Quick access destinations
    const quickAccess = [
        { name: 'Main Campus', code: 'MAIN', icon: '🏛️', color: 'bg-blue-100 text-blue-700' },
        { name: 'Library', code: 'LIB', icon: '📚', color: 'bg-green-100 text-green-700' },
        { name: 'Computer Labs', code: 'AC', icon: '💻', color: 'bg-purple-100 text-purple-700' },
        { name: 'Research Center', code: 'RES', icon: '🔬', color: 'bg-orange-100 text-orange-700' }
    ];

    useEffect(() => {
        if (selectedBuilding) {
            loadBuildingData(selectedBuilding);
            addToRecentBuildings(selectedBuilding);
        }
    }, [selectedBuilding]);

    useEffect(() => {
        // Load saved favorites and recent buildings
        const savedFavorites = localStorage.getItem('campus_favorites');
        const savedRecent = localStorage.getItem('recent_buildings');
        
        if (savedFavorites) {
            setFavorites(JSON.parse(savedFavorites));
        }
        if (savedRecent) {
            setRecentBuildings(JSON.parse(savedRecent));
        }
    }, []);

    const loadBuildingData = async (buildingCode) => {
        setLoading(true);
        setError(null);
    
        try {
            console.log('🗺️ Loading comprehensive data for building:', buildingCode);
      
            // Load all building data in parallel
            const [details, transport, parking] = await Promise.allSettled([
                ClujUniversityMapsService.getBuildingDetails(buildingCode),
                ClujUniversityMapsService.getTransportInfo(buildingCode, showRealTimeData),
                ClujUniversityMapsService.getParkingInfo(buildingCode)
            ]);
      
            if (details.status === 'fulfilled') {
                setBuildingDetails(details.value);
            }
      
            if (transport.status === 'fulfilled') {
                setTransportInfo(transport.value);
            }
      
            if (parking.status === 'fulfilled') {
                setParkingInfo(parking.value);
            }
      
            console.log('✅ Building data loaded successfully');
        } catch (err) {
            setError(`Failed to load data for ${buildingCode}`);
            console.error('❌ Error loading building data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getDirections = async (fromCode, toCode) => {
        try {
            setLoading(true);
            const directions = await ClujUniversityMapsService.getDirections(fromCode, toCode, 'walking');
            setDirectionsInfo(directions);
            setActiveView('navigation');
        } catch (err) {
            setError('Failed to get directions');
        } finally {
            setLoading(false);
        }
    };

    const addToRecentBuildings = (buildingCode) => {
        const updated = [buildingCode, ...recentBuildings.filter(b => b !== buildingCode)].slice(0, 5);
        setRecentBuildings(updated);
        localStorage.setItem('recent_buildings', JSON.stringify(updated));
    };

    const toggleFavorite = (buildingCode) => {
        const updated = favorites.includes(buildingCode) 
        ? favorites.filter(b => b !== buildingCode)
        : [...favorites, buildingCode];
    
        setFavorites(updated);
        localStorage.setItem('campus_favorites', JSON.stringify(updated));
    };

    const openInGoogleMaps = () => {
        if (buildingDetails) {
            const url = `https://www.google.com/maps/search/?api=1&query=${buildingDetails.latitude},${buildingDetails.longitude}`;
            window.open(url, '_blank');
        }
    };

    const refreshData = () => {
        if (selectedBuilding) {
        loadBuildingData(selectedBuilding);
        }
    };

    const DashboardOverview = () => (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-2 text-gray-900">
                    Welcome to UTCN Campus Navigation!
                </h2>
                <p className="text-gray-700">
                    Find buildings, get directions, check transport options, and locate parking lots.
                </p>
            
                {currentUser && (
                    <div className="mt-4 bg-blue-100 rounded-lg p-3 border border-blue-200">
                        <p className="text-sm text-gray-800">
                            👋 Hello, {currentUser.name}! Ready to explore the campus?
                        </p>
                    </div>
                )}
            </div>

            {/* Quick Access */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Quick Access
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {quickAccess.map((item) => (
                        <button
                            key={item.code}
                            onClick={() => setSelectedBuilding(item.code)}
                            className={`${item.color} p-4 rounded-xl text-center hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1`}
                        >
                            <div className="text-2xl mb-2">{item.icon}</div>
                            <div className="font-medium text-sm">{item.name}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Recent Buildings */}
            {recentBuildings.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        Recent Buildings
                    </h3>
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                        {recentBuildings.map((buildingCode) => (
                            <button
                                key={buildingCode}
                                onClick={() => setSelectedBuilding(buildingCode)}
                                className="flex-shrink-0 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                            >
                                {buildingCode}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Campus Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-800">5+</div>
                        <div className="text-blue-600 text-sm">Campus Buildings</div>
                </div>
            
                <div className="bg-green-50 rounded-xl p-4 text-center">
                    <Bus className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-800">8+</div>
                    <div className="text-green-600 text-sm">Transport Routes</div>
                </div>
            
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                    <ParkingCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-800">350+</div>
                    <div className="text-orange-600 text-sm">Parking Spaces</div>
                </div>
            </div>
        </div>
    );

    const NavigationView = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Navigation className="w-5 h-5" />
                    Campus Navigation
                </h3>
                <button
                    onClick={() => setActiveView('overview')}
                    className="text-gray-500 hover:text-gray-700"
                >
                    Back to Overview
                </button>
            </div>

            {directionsInfo ? (
                <div className="bg-white rounded-xl p-6 shadow-lg border">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-800">
                            Directions: {directionsInfo.from.building} → {directionsInfo.to.building}
                        </h4>
                        <button
                            onClick={() => window.open(directionsInfo.google_maps_url, '_blank')}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Google Maps
                        </button>
                    </div>
          
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-sm text-gray-600">Distance</div>
                                <div className="font-semibold">{directionsInfo.distance_km} km</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-sm text-gray-600">Walking Time</div>
                                <div className="font-semibold">{directionsInfo.estimated_time_minutes} minutes</div>
                            </div>
                        </div>
            
                        <div className="bg-blue-50 rounded-lg p-3">
                            <div className="text-sm text-blue-600 mb-1">Instructions</div>
                            <div className="text-blue-800">{directionsInfo.instructions}</div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl p-6 shadow-lg border">
                    <h4 className="font-semibold text-gray-800 mb-4">Get Directions</h4>
                    <div className="text-gray-600">
                        Select a building to see navigation options and get walking directions.
                    </div>
                </div>
            )}
        </div>
    );

    const TransportView = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Bus className="w-5 h-5" />
                    Public Transport
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowRealTimeData(!showRealTimeData)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                            showRealTimeData 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                        {showRealTimeData ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            Real-time
                    </button>
                    <button
                        onClick={() => setActiveView('overview')}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        Back
                    </button>
                </div>
            </div>

            {transportInfo ? (
                <div className="space-y-4">
                    {Object.entries(transportInfo.available_transport || {}).map(([type, routes]) => (
                        <div key={type} className="bg-white rounded-xl p-6 shadow-lg border">
                            <h4 className="font-semibold text-gray-800 mb-4 capitalize flex items-center gap-2">
                                <Bus className="w-5 h-5 text-blue-600" />
                                {type} Routes
                            </h4> 
              
                            <div className="space-y-3">
                                {routes.map((route, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                                    style={{ backgroundColor: route.route_color || '#3B82F6' }}
                                                >
                                                    {route.route_number}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{route.route_name}</div>
                                                    <div className="text-sm text-gray-600">{route.stop_name}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-gray-600">Walk</div>
                                                <div className="font-medium">{route.walking_time_minutes} min</div>
                                            </div>
                                        </div>
                    
                                        {route.schedule && (
                                            <div className="bg-gray-50 rounded p-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span>Frequency: {route.schedule.peak_frequency_minutes}min</span>
                                                    <span>Hours: {route.schedule.first_departure} - {route.schedule.last_departure}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
          
                    {transportInfo.general_info && (
                        <div className="bg-blue-50 rounded-xl p-4">
                            <h5 className="font-medium text-blue-800 mb-2">Ticket Information</h5>
                            <div className="text-blue-700 text-sm space-y-1">
                                {Object.entries(transportInfo.general_info.ticket_prices || {}).map(([type, price]) => (
                                    <div key={type} className="flex justify-between">
                                        <span className="capitalize">{type.replace('_', ' ')}:</span>
                                        <span className="font-medium">{price}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl p-6 shadow-lg border text-center text-gray-600">
                    Select a building to see public transport options
                </div>
            )}
        </div>
    );

    const ParkingView = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <ParkingCircle className="w-5 h-5" />
                    Parking Information
                </h3>
                <button
                    onClick={() => setActiveView('overview')}
                    className="text-gray-500 hover:text-gray-700"
                >
                    Back to Overview
                </button>
            </div>

            {parkingInfo?.parking_areas ? (
                <div className="space-y-4">
                    {parkingInfo.parking_areas.map((parking, index) => (
                        <div key={index} className="bg-white rounded-xl p-6 shadow-lg border">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="font-semibold text-gray-800">{parking.name}</h4>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {parking.distance.walking_time_minutes} minute walk • {parking.distance.meters}m away
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    parking.pricing.type === 'free' ? 'bg-green-100 text-green-700' :
                                    parking.pricing.type === 'permit_only' ? 'bg-blue-100 text-blue-700' :
                                    'bg-orange-100 text-orange-700'
                                }`}>
                                    {parking.pricing.type === 'free' ? 'Free' :
                                    parking.pricing.type === 'permit_only' ? 'Permit Only' :
                                    `${parking.pricing.hourly_rate} RON/h`}
                                </div>
                            </div>
                
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{parking.capacity.total_spaces}</div>
                                    <div className="text-sm text-gray-600">Total Spaces</div>
                                </div>
                    
                                {parking.capacity.available_spaces !== null && (
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{parking.capacity.available_spaces}</div>
                                        <div className="text-sm text-gray-600">Available</div>
                                    </div>
                                )}
                    
                                {parking.capacity.accessibility_spaces > 0 && (
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-600">{parking.capacity.accessibility_spaces}</div>
                                        <div className="text-sm text-gray-600">Accessible</div>
                                    </div>
                                )}
                    
                                {parking.capacity.ev_charging_stations > 0 && (
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-yellow-600">{parking.capacity.ev_charging_stations}</div>
                                        <div className="text-sm text-gray-600">EV Charging</div>
                                    </div>
                                )}
                            </div>
                
                            {parking.access.operating_hours && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-sm font-medium text-gray-700 mb-1">Operating Hours</div>
                                    <div className="text-sm text-gray-600">
                                        {Object.entries(parking.access.operating_hours).map(([day, hours]) => (
                                            <div key={day} className="flex justify-between">
                                                <span className="capitalize">{day}:</span>
                                                <span>{hours}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
            
                    {parkingInfo.summary && (
                        <div className="bg-green-50 rounded-xl p-4">
                            <h5 className="font-medium text-green-800 mb-2">Parking Summary</h5>
                            <div className="text-green-700 text-sm space-y-1">
                                <div>Total areas found: {parkingInfo.summary.total_areas_found}</div>
                                <div>Total spaces: {parkingInfo.summary.total_spaces}</div>
                                {parkingInfo.summary.free_parking_available && (
                                    <div>✅ Free parking lots available</div>
                                )}
                                {parkingInfo.summary.accessibility_parking_available && (
                                    <div>♿ Accessible parking available</div>
                                )}
                                {parkingInfo.summary.ev_charging_available && (
                                    <div>⚡ EV charging available</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl p-6 shadow-lg border text-center text-gray-600">
                    Select a building to see nearby parking options
                </div>
            )}
        </div>
    );

    return (
        <div className="maps-dashboard max-w-7xl mx-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Sidebar - Building Selection */}
                <div className="lg:col-span-1">
                    <BuildingSelectorComponent
                        onBuildingSelect={(code, building) => setSelectedBuilding(code)}
                        selectedBuilding={selectedBuilding}
                    />
                </div>
            
                {/* Main Content Area */}
                <div className="lg:col-span-2">
                        {/* Navigation Tabs */}
                        <div className="bg-white rounded-lg shadow-lg border border-gray-200 mb-6">
                            <div className="flex border-b border-gray-200">
                                {[
                                    { id: 'overview', label: 'Overview', icon: Map },
                                    { id: 'navigation', label: 'Navigation', icon: Navigation },
                                    { id: 'transport', label: 'Transport', icon: Bus },
                                    { id: 'parking', label: 'Parking', icon: ParkingCircle }
                                ].map(({ id, label, icon: Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => setActiveView(id)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 text-sm font-medium transition-colors ${
                                            activeView === id
                                            ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Error State */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <div className="flex items-start space-x-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                    <div>
                                        <h4 className="text-red-800 font-medium">Error</h4>
                                        <p className="text-red-700 text-sm mt-1">{error}</p>
                                        <button
                                            onClick={refreshData}
                                            className="text-red-600 hover:text-red-800 text-sm underline mt-2"
                                        >
                                            Try again
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Loading State */}
                        {loading && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center space-x-3">
                                    <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                                    <span className="text-blue-800">Loading campus information...</span>
                                </div>
                            </div>
                        )}

                        {/* View Content */}
                        <div className="min-h-96">
                            {activeView === 'overview' && <DashboardOverview />}
                            {activeView === 'navigation' && <NavigationView />}
                            {activeView === 'transport' && <TransportView />}
                            {activeView === 'parking' && <ParkingView />}
                        </div>

                    {/* Selected Building Quick Actions */}
                    {selectedBuilding && buildingDetails && (
                        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 mt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800">{buildingDetails.name}</h4>
                                        <p className="text-sm text-gray-600">{buildingDetails.code}</p>
                                    </div>
                                </div>
                
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => toggleFavorite(selectedBuilding)}
                                        className={`p-2 rounded-lg transition-colors ${
                                            favorites.includes(selectedBuilding)
                                                ? 'bg-red-100 text-red-600'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        <Star className={`w-4 h-4 ${favorites.includes(selectedBuilding) ? 'fill-current' : ''}`} />
                                    </button>
                    
                                    <button
                                        onClick={openInGoogleMaps}
                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                
                                    {buildingDetails.contact_info?.phone && (
                                        <button
                                            onClick={() => window.open(`tel:${buildingDetails.contact_info.phone}`)}
                                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                        >
                                            <Phone className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

};

export default MapsDashboardComponent;