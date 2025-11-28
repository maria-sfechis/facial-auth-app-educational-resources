import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, MapPin, Monitor, Star, CheckCircle, Info } from 'lucide-react';
import reservationService from './reservationService';
import { API_CONFIG } from './config';

const FilterReservationModal = ({ 
    isOpen, 
    onClose, 
    filters, 
    currentUser, 
    onReservationCreated,
    allResources 
}) => {
    const [availableResources, setAvailableResources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedResource, setSelectedResource] = useState('');
    const [reservationForm, setReservationForm] = useState({
        purpose: 'Study Session',
        peopleCount: 1,
        specialRequests: ''
    });

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

    useEffect(() => {
        if (isOpen && filters.date && filters.startTime && filters.endTime) {
            const validationError = validateDateTime(filters.date, filters.startTime, filters.endTime);
            if (validationError) {
                setError(validationError);
                return;
            }
            setError('');
            fetchFilteredResources();
        }
    }, [isOpen, filters]);

    const validateDateTime = (date, startTime, endTime) => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().slice(0, 5);
        // Check if date is in the past
        if (date < today) {
            return `Cannot make reservations for past dates. Selected: ${date}, Today: ${today}`;
        }
        // Check if time is in the past (for today's reservations)
        if (date === today && startTime <= currentTime) {
            return `Cannot make reservations for past times. Selected: ${startTime}, Current time: ${currentTime}`;
        }
        // Check if end time is after start time
        if (startTime >= endTime) {
            return 'End time must be after start time';
        }
        const start = new Date(`2000-02-02T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        const diffMinutes = (end - start) / (1000 * 60);

        if (diffMinutes > 480) { // 8 hours
            return 'Reservation cannot be longer than 8 hours';    
        }
        return null;
    };
    
    const fetchFilteredResources = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                date: filters.date,
                startTime: filters.startTime,
                endTime: filters.endTime
            });
            if (filters.category) params.append('category', filters.category);
            if (filters.minCapacity) params.append('minCapacity', filters.minCapacity);

            const response = await fetch(API_CONFIG.getApiUrl(`/api/resources?${params}`));
            const data = await response.json();

            if (response.ok) {
                const flatResources = [];
                Object.entries(data.resources || {}).forEach(([category, resources]) => {
                    resources.forEach(resource => {
                        if (resource.available) {
                            flatResources.push({
                                ...resource,
                                category: category,
                                displayName: `${resource.name} (${category})`
                            });
                        }
                    });
                });
                setAvailableResources(flatResources);
                if (flatResources.length === 0) {
                    setError('No available resources found for the selected time slot. Please try a different time or date.');    
                }
            } else {
                setError(data.error || 'Failed to fetch available resources');
            }
        } catch (error) {
            console.error('Error fetching filtered resources:', error);
            setError('Failed to fetch available resources');    
        } finally {
            setLoading(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedResource) {
            setError('Please select a resource');
            return;
        }
        const resourceDetails = availableResources.find(r => r.id === parseInt(selectedResource));
        if(!resourceDetails) {
            setError('Selected resource not found');
            return;
        }
        const validationError = validateDateTime(filters.date, filters.startTime, filters.endTime);
        if (validationError) {
            setError(validationError);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const reservationData = {
                userId: currentUser.id,
                resourceType: resourceDetails.category,
                resourceName: resourceDetails.name,
                date: filters.date,
                startTime: filters.startTime,
                endTime: filters.endTime,
                purpose: reservationForm.purpose,
                peopleCount: parseInt(reservationForm.peopleCount),
                specialRequests: reservationForm.specialRequests    
            };

            const reservation = await reservationService.createReservation(reservationData);
            onReservationCreated(reservation);
            onClose();

            setSelectedResource('');
            setReservationForm({
                purpose: 'Study Session',
                peopleCount: 1,
                specialRequests: ''
            });
        } catch (error) {
            console.error('Reservation error:', error);
            setError(error.message || 'Failed to create reservation');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
                <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Available Resources</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Search Criteria Display */}
                <div className="bg-indigo-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-indigo-800 mb-2">Search Criteria</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-indigo-600">📅 Date:</span>
                            <p className="font-medium">{new Date(filters.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <span className="text-indigo-600">⏰ Time:</span>
                            <p className="font-medium">{filters.startTime} - {filters.endTime}</p>
                        </div>
                        {filters.category && (
                            <div>
                                <span className="text-indigo-600">📂 Category:</span>
                                <p className="font-medium">{filters.category}</p>
                            </div>
                        )}
                        {filters.minCapacity && (
                            <div>
                                <span className="text-indigo-600">👥 Min Capacity:</span>
                                <p className="font-medium">{filters.minCapacity}+ people</p>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
                        {error}
                    </div>    
                )}

                {loading ? (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center px-6 py-3 font-semibold leading-6 text-sm shadow rounded-xl text-indigo-500 bg-white hover:bg-indigo-50 transition duration-300 animate-pulse">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Searching available resources...
                        </div>
                    </div>
                ) : availableResources.length === 0 ? (
                    <div className="text-center py-8">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">No available resources found</p>
                        <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
                    </div>
                ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                {/* Available Resources */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Available Resources ({availableResources.length} found)
                    </label>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
                        {availableResources.map((resource) => (
                        <div key={resource.id} className="mb-2">
                            <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input
                                    type="radio"
                                    name="selectedResource"
                                    value={resource.id}
                                    checked={selectedResource === resource.id.toString()}
                                    onChange={(e) => setSelectedResource(e.target.value)}
                                    className="mt-1"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-gray-800">{resource.name}</h4>
                                        <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                                            {resource.category}
                                        </span>
                                    </div>
                            
                                    <div className="mt-1 text-sm text-gray-500 space-y-1">
                                        {resource.location && (
                                            <p className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {resource.location}
                                            </p>
                                        )}
                                        {(resource.capacity || resource.computers) && (
                                            <p className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                Capacity: {resource.capacity || resource.computers}
                                            </p>
                                        )}
                                        {resource.amenities && resource.amenities.length > 0 && (
                                            <p className="text-xs text-gray-400">
                                                {resource.amenities.slice(0, 3).join(', ')}
                                                {resource.amenities.length > 3 && ` +${resource.amenities.length - 3} more`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reservation Details */}
            {selectedResource && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <h3 className="font-medium text-gray-800">Reservation Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                            <select
                                value={reservationForm.purpose}
                                onChange={(e) => setReservationForm({...reservationForm, purpose: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                required
                            >
                                {purposes.map((purpose) => (
                                    <option key={purpose} value={purpose}>{purpose}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Number of People</label>
                            <input
                                type="number"
                                min="1"
                                max="50"
                                value={reservationForm.peopleCount}
                                onChange={(e) => setReservationForm({...reservationForm, peopleCount: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                        <textarea
                            rows={3}
                            placeholder="Any special requirements or requests..."
                            value={reservationForm.specialRequests}
                            onChange={(e) => setReservationForm({...reservationForm, specialRequests: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
                <button
                    type="submit"
                    disabled={loading || !selectedResource}
                    className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {loading ? 'Creating Reservation...' : 'Create Reservation'}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
            </div>
            </form>
            )}
        </div>
        </div>
    </div>
    );
};

export default FilterReservationModal;

