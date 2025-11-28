import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import reservationService from './reservationService';


const ReservationModal = ({ isOpen, onClose, resourceType, currentUser, onReservationCreated, allResources }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        resourceName: '',
        selectedCategory: resourceType || ''
    });
    const [availableResources, setAvailableResources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Enhanced date and time validation
    const validateDateTime = (date, startTime, endTime) => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().slice(0, 5);

        // Check if date is in the past
        if (date < today) {
            return `Cannot make reservations for past dates. Selected: ${date}, Today: ${today}`;
        }

        // Check if time is in the past (for today's reservations)
        if (date === today && startTime && startTime <= currentTime) {
            return `Cannot make reservations for past times. Selected: ${startTime}, Current time: ${currentTime}`;
        }

        // Check if end time is after start time
        if (startTime && endTime && startTime >= endTime) {
            return 'End time must be after start time';
        }

        // Check if the time difference is reasonable (at least 30 minutes)
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

    const bookableCategories = ['Study Rooms', 'Computer Labs', 'Collaboration Spaces'];
    const categories = resourceType ? [resourceType] : bookableCategories;

    useEffect(() => {
        if (isOpen && formData.selectedCategory && bookableCategories.includes(formData.selectedCategory)) {
            const categoryResources = allResources[formData.selectedCategory] || [];
            setAvailableResources(categoryResources.filter(r => r.available));
        }
    }, [formData.selectedCategory, isOpen, allResources]);

    // Validate when form data changes
    useEffect(() => {
        const validationError = validateDateTime(formData.date, formData.startTime, formData.endTime);
        if (validationError && formData.date && formData.startTime && formData.endTime) {
            setError(validationError);
        } else if (!validationError) {
            setError('');
        }
    }, [formData.date, formData.startTime, formData.endTime]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('🔍 FORM DEBUG - Raw form data:', formData);
        console.log('🔍 FORM DEBUG - Selected date:', formData.date);
        console.log('🔍 FORM DEBUG - Date object:', new Date(formData.date));
        
        // Enhanced validation before submission
        const validationError = validateDateTime(formData.date, formData.startTime, formData.endTime);
        if (validationError) {
            setError(validationError);
            return;
        }
        
        setError('');
        setLoading(true);

        try {
            const reservationData = {
                userId: currentUser.id,
                resourceType: formData.selectedCategory,
                resourceName: formData.resourceName,
                date: formData.date,
                startTime: formData.startTime,
                endTime: formData.endTime
            };

            console.log('🔍 RESERVATION SEND - Data being sent:', reservationData);
            console.log('🔍 RESERVATION SEND - Date field:', reservationData.date);

            const reservation = await reservationService.createReservation(reservationData);
            onReservationCreated(reservation);
            onClose();
            // Reset form
            setFormData({
                date: new Date().toISOString().split('T')[0],
                startTime: '',
                endTime: '',
                resourceName: '',
                selectedCategory: resourceType || ''
            });
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">
                        Book a Space
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Space Category</label>
                        <select
                            value={formData.selectedCategory}
                            onChange={(e) => {
                                setFormData({...formData, selectedCategory: e.target.value, resourceName: ''});
                                setAvailableResources([]);
                            }}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                        >
                            <option value="">Choose a category</option>
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>    
                
                    <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                value={formData.date}
                                min={new Date().toISOString().split('T')[0]}
                                max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Max 1 year ahead
                                onChange={(e) => {
                                    setFormData({...formData, date: e.target.value});
                                    // Reset times if date changes to today and current times are in the past
                                    if (e.target.value === new Date().toISOString().split('T')[0]) {
                                        const currentTime = new Date().toTimeString().slice(0, 5);
                                        if (formData.startTime <= currentTime) {
                                            setFormData({...formData, date: e.target.value, startTime: '', endTime: ''});
                                        }
                                    }
                                }}
                                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        {formData.date === new Date().toISOString().split('T')[0] && (
                            <p className="text-xs text-blue-600 mt-1">
                                ℹ️ Today - only future times are available
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Start Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="time"
                                    value={formData.startTime}
                                    min={formData.date === new Date().toISOString().split('T')[0] ? 
                                        new Date(Date.now() + 30 * 60 * 1000).toTimeString().slice(0, 5) : // 30 minutes from now if today
                                        undefined
                                    }
                                    onChange={(e) => {
                                        setFormData({...formData, startTime: e.target.value});
                                        // Clear end time if start time changes and would make end time invalid
                                        if (formData.endTime && e.target.value >= formData.endTime) {
                                            setFormData({...formData, startTime: e.target.value, endTime: ''});
                                        }
                                    }}
                                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            {formData.date === new Date().toISOString().split('T')[0] && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Minimum: {new Date(Date.now() + 30 * 60 * 1000).toTimeString().slice(0, 5)} (30 min from now)
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">End Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="time"
                                    value={formData.endTime}
                                    min={formData.startTime ? 
                                        (() => {
                                            try {
                                                const startTime = new Date(`2000-01-01T${formData.startTime}`);
                                                const minEndTime = new Date(startTime.getTime() + 30 * 60 * 1000);
                                                return minEndTime.toTimeString().slice(0, 5);
                                            } catch {
                                                return formData.startTime;
                                            }
                                        })() : undefined
                                    }
                                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            {formData.startTime && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Minimum: {(() => {
                                        try {
                                            const startTime = new Date(`2000-01-01T${formData.startTime}`);
                                            const minEndTime = new Date(startTime.getTime() + 30 * 60 * 1000);
                                            return minEndTime.toTimeString().slice(0, 5);
                                        } catch {
                                            return formData.startTime;
                                        }
                                    })()} (30 min after start)
                                </p>
                            )}
                        </div>
                    </div>

                    {/*Available Spaces*/}
                    {formData.selectedCategory && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Available Spaces</label>
                            <select 
                                value={formData.resourceName}
                                onChange={(e) => setFormData({...formData, resourceName: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                required
                            >
                                <option value="">Choose a space</option>
                                {availableResources.map((resource) => (
                                    <option key={resource.id} value={resource.name}>
                                        {resource.name}
                                        {resource.capacity && ` (Capacity: ${resource.capacity})`}
                                        {resource.computers && ` (${resource.computers} computers)`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm">
                            <div className="flex items-start gap-2">
                                <span className="text-red-500 font-bold">⚠️</span>
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading || !formData.resourceName || error}
                            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Booking...' : 'Create Reservation'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReservationModal;