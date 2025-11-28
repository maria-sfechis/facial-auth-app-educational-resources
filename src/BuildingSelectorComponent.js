import './BuildingSelectorComponent.css';

import React, { useState, useEffect } from 'react';
import { 
    Building2, MapPin, Users, Clock, Bus, ParkingCircle, 
    ChevronDown, ChevronUp, Search, Filter, X, Navigation,
    Wifi, Monitor, Coffee, Zap, Phone, ExternalLink
} from 'lucide-react';
import ClujUniversityMapsService from './clujUniversityMapsService';

const BuildingSelectorComponent = ({ 
    onBuildingSelect, 
    selectedBuilding = null,
    showOnMap = false,
    compact = false 
}) => {
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBuildingDetails, setSelectedBuildingDetails] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [filterType, setFilterType] = useState('all'); // all, academic, research, library
    const [expandedBuilding, setExpandedBuilding] = useState(null);

    useEffect(() => {
        loadBuildings();
    }, []);

    useEffect(() => {
        if (selectedBuilding) {
            loadBuildingDetails(selectedBuilding);
        }
    }, [selectedBuilding]);

    const loadBuildings = async () => {
        setLoading(true);
        setError(null);
    
        try {
            const buildingsData = await ClujUniversityMapsService.getAllBuildings();
            setBuildings(buildingsData);
            console.log('🏢 Buildings loaded for selector:', buildingsData.length);
        } catch (err) {
            setError('Failed to load buildings');
            console.error('❌ Error loading buildings:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadBuildingDetails = async (buildingCode) => {
        try {
            const details = await ClujUniversityMapsService.getBuildingDetails(buildingCode);
            setSelectedBuildingDetails(details);
        } catch (err) {
            console.error('❌ Error loading building details:', err);
        }
    };

    const handleBuildingClick = (building) => {
        if (selectedBuilding === building.code) {
            // Toggle details if same building clicked
            setShowDetails(!showDetails);
        } else {
            // Select new building
            onBuildingSelect(building.code, building);
            setShowDetails(true);
        }
    };

    const toggleBuildingExpansion = (buildingCode, event) => {
        event.stopPropagation();
        setExpandedBuilding(expandedBuilding === buildingCode ? null : buildingCode);
    };

    const openInGoogleMaps = (building, event) => {
        event.stopPropagation();
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${building.latitude},${building.longitude}`;
        window.open(googleMapsUrl, '_blank');
    };

    const filteredBuildings = buildings.filter(building => {
        const matchesSearch = building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            building.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            building.code.toLowerCase().includes(searchTerm.toLowerCase());
    
        const matchesFilter = filterType === 'all' || building.building_type === filterType;
        return matchesSearch && matchesFilter;
    });

    const getBuildingTypeIcon = (type) => {
        switch(type) {
            case 'academic': return '🎓';
            case 'research': return '🔬';
            case 'library': return '📚';
            case 'administrative': return '🏛️';
            case 'residential': return '🏠';
            case 'recreational': return '🏃';
            case 'medical': return '🏥';
            default: return '🏢';
        }
    };

    const getBuildingTypeColor = (type) => {
        switch(type) {
            case 'academic': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'research': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'library': return 'bg-green-100 text-green-700 border-green-200';
            case 'administrative': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'residential': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'recreational': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
            case 'medical': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="building-selector-loading p-4 bg-white rounded-lg shadow-lg">
                <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <span className="text-gray-600">Loading buildings...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="building-selector-error p-4 bg-white rounded-lg shadow-lg border-l-4 border-red-500">
                <div className="flex items-center space-x-2 text-red-700">
                    <X className="w-5 h-5" />
                        <span>{error}</span>
                </div>
                <button 
                    onClick={loadBuildings}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (compact) {
        return (
            <div className="building-selector-compact">
                <select
                    value={selectedBuilding || ''}
                    onChange={(e) => onBuildingSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="">All Buildings</option>
                    {buildings.map(building => (
                        <option key={building.id} value={building.code}>
                            {getBuildingTypeIcon(building.building_type)} {building.name}
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    return (
        <div className="building-selector bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Building2 className="w-6 h-6" />
                        <h3 className="text-lg font-semibold">Campus Buildings</h3>
                    </div>
                    <div className="text-sm bg-white/20 px-2 py-1 rounded">
                        {filteredBuildings.length} building{filteredBuildings.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="p-4 border-b border-gray-200 space-y-3">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search buildings by name, address, or code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Type Filter */}
                <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Types</option>
                        <option value="academic">🎓 Academic</option>
                        <option value="research">🔬 Research</option>
                        <option value="library">📚 Library</option>
                        <option value="administrative">🏛️ Administrative</option>
                        <option value="residential">🏠 Residential</option>
                        <option value="recreational">🏃 Recreational</option>
                        <option value="medical">🏥 Medical</option>
                    </select>
                </div>
            </div>

            {/* Buildings List */}
            <div className="max-h-96 overflow-y-auto">
                {filteredBuildings.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                        <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No buildings found matching your criteria</p>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterType('all');
                            }}
                            className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm underline"
                        >
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredBuildings.map((building) => {
                            const isSelected = selectedBuilding === building.code;
                            const isExpanded = expandedBuilding === building.code;
              
                            return (
                                <div key={building.id} className="building-item">
                                    {/* Main Building Info */}
                                    <div
                                        onClick={() => handleBuildingClick(building)}
                                        className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                                            isSelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <span className="text-lg">
                                                        {getBuildingTypeIcon(building.building_type)}
                                                    </span>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-800 text-sm">
                                                            {building.name}
                                                        </h4>
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            <span className={`px-2 py-1 rounded-full text-xs border ${getBuildingTypeColor(building.building_type)}`}>
                                                                {building.code}
                                                            </span>
                                                            <span className={`px-2 py-1 rounded-full text-xs border ${getBuildingTypeColor(building.building_type)}`}>
                                                                {building.building_type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                        
                                                <div className="text-xs text-gray-600 space-y-1">
                                                    <div className="flex items-center space-x-1">
                                                        <MapPin className="w-3 h-3" />
                                                        <span className="truncate">{building.address}</span>
                                                    </div>
                                                    {building.capacity > 0 && (
                                                        <div className="flex items-center space-x-1">
                                                            <Users className="w-3 h-3" />
                                                            <span>Capacity: {building.capacity}</span>
                                                        </div>
                                                    )}
                                                    {building.floors > 1 && (
                                                        <div className="flex items-center space-x-1">
                                                            <Building2 className="w-3 h-3" />
                                                            <span>{building.floors} floors</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center space-x-1 ml-2">
                                                <button
                                                    onClick={(e) => openInGoogleMaps(building, e)}
                                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Open in Google Maps"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                        
                                                <button
                                                    onClick={(e) => toggleBuildingExpansion(building.code, e)}
                                                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                                    title="Toggle details"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200 animate-slideDown">
                                            <div className="pt-3 space-y-3">
                                                {/* Building Amenities */}
                                                {building.amenities && Object.keys(building.amenities).length > 0 && (
                                                    <div>
                                                        <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center space-x-1">
                                                            <Monitor className="w-3 h-3" />
                                                            <span>Amenities</span>
                                                        </h5>
                                                        <div className="flex flex-wrap gap-1">
                                                            {Object.entries(building.amenities).map(([amenity, available]) => 
                                                                available && (
                                                                    <span key={amenity} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                                                        {amenity.replace('_', ' ')}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Opening Hours */}
                                                {building.opening_hours && (
                                                    <div>
                                                        <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center space-x-1">
                                                            <Clock className="w-3 h-3" />
                                                            <span>Opening Hours</span>
                                                        </h5>
                                                        <div className="text-xs text-gray-600 space-y-1">
                                                            {building.opening_hours.weekdays && (
                                                                <div>Weekdays: {building.opening_hours.weekdays}</div>
                                                            )}
                                                            {building.opening_hours.saturday && (
                                                                <div>Saturday: {building.opening_hours.saturday}</div>
                                                            )}
                                                            {building.opening_hours.sunday && (
                                                                <div>Sunday: {building.opening_hours.sunday}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Contact Info */}
                                                {building.contact_info && (
                                                    <div>
                                                        <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center space-x-1">
                                                            <Phone className="w-3 h-3" />
                                                            <span>Contact</span>
                                                        </h5>
                                                        <div className="text-xs text-gray-600 space-y-1">
                                                            {building.contact_info.phone && (
                                                                <div>📞 {building.contact_info.phone}</div>
                                                            )}
                                                            {building.contact_info.email && (
                                                                <div>📧 {building.contact_info.email}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Quick Actions */}
                                                <div className="flex space-x-2 pt-2">
                                                    <button
                                                        onClick={() => handleBuildingClick(building)}
                                                        className="flex-1 px-3 py-2 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors"
                                                    >
                                                        View Resources
                                                    </button>
                                                    <button
                                                        onClick={(e) => openInGoogleMaps(building, e)}
                                                        className="px-3 py-2 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors flex items-center space-x-1"
                                                    >
                                                        <Navigation className="w-3 h-3" />
                                                        <span>Directions</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            {selectedBuilding && selectedBuildingDetails && showDetails && (
                <div className="border-t border-gray-200 bg-indigo-50 p-4">
                    <div className="text-sm">
                        <div className="font-semibold text-indigo-800 mb-2">
                            Selected: {selectedBuildingDetails.name}
                        </div>
                        <div className="text-indigo-700 space-y-1">
                            {selectedBuildingDetails.transport_access?.length > 0 && (
                                <div className="flex items-center space-x-1">
                                    <Bus className="w-3 h-3" />
                                    <span>{selectedBuildingDetails.transport_access.length} transport options</span>
                                </div>
                            )}
                            {selectedBuildingDetails.nearby_parking?.length > 0 && (
                                <div className="flex items-center space-x-1">
                                    <ParkingCircle className="w-3 h-3" />
                                    <span>{selectedBuildingDetails.nearby_parking.length} parking areas</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuildingSelectorComponent;