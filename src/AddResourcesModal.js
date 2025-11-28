import React, { useState } from 'react';
import { X, Plus, Monitor, BookOpen, Package, Building, Calendar, Clock, Users, Zap, Grid, List, Search, Filter, Star, CheckCircle, AlertCircle } from 'lucide-react';

const AddResourcesModal = ({ isOpen, onClose, reservation, allResources, onResourcesAdded }) => {
  const [selectedResources, setSelectedResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('smart');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Resource categories with icons and colors
  const resourceCategories = [
    { 
      id: 'equipment', 
      name: 'Equipment', 
      icon: Package, 
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'templates', 
      name: 'Templates & Tools', 
      icon: Grid, 
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-purple-600'
    },
    { 
      id: 'software', 
      name: 'Software Licenses', 
      icon: Monitor, 
      color: 'bg-green-500',
      gradient: 'from-green-500 to-green-600'
    },
    { 
      id: 'learning', 
      name: 'Learning Materials', 
      icon: BookOpen, 
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-orange-600'
    },
    { 
      id: 'special', 
      name: 'Special Equipment', 
      icon: Star, 
      color: 'bg-red-500',
      gradient: 'from-red-500 to-red-600'
    },
    { 
      id: 'study', 
      name: 'Study Aids', 
      icon: Users, 
      color: 'bg-indigo-500',
      gradient: 'from-indigo-500 to-indigo-600'
    }
  ];

  // Mock resources for demonstration
  const mockResources = [
    { id: 1, name: 'Projector HD-4K', category: 'equipment', available: true, rating: 4.8, description: 'High-definition projector perfect for presentations' },
    { id: 2, name: 'Wireless Microphone Set', category: 'equipment', available: true, rating: 4.6, description: 'Professional wireless microphone system' },
    { id: 3, name: 'Presentation Template Pack', category: 'templates', available: true, rating: 4.9, description: 'Modern PowerPoint templates for academic presentations' },
    { id: 4, name: 'Adobe Creative Suite', category: 'software', available: false, rating: 4.7, description: 'Complete creative software package' },
    { id: 5, name: 'Study Guide: Advanced Mathematics', category: 'learning', available: true, rating: 4.5, description: 'Comprehensive study materials for advanced math courses' },
  ];

  const handleAddResource = (resource) => {
    if (!selectedResources.find(r => r.id === resource.id)) {
      setSelectedResources([...selectedResources, resource]);
    }
  };

  const handleRemoveResource = (resourceId) => {
    setSelectedResources(selectedResources.filter(r => r.id !== resourceId));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      onResourcesAdded(selectedResources);
      onClose();
    } catch (error) {
      console.error('Error adding resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = mockResources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Add Resources</h2>
                <p className="text-blue-100 mt-1 text-sm">
                  Enhance your {reservation?.resource_type || 'study'} session with additional resources
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm"
            >
              <X className="w-6 h-6 m-6" />
            </button>
          </div>
        </div>

        {/* Reservation Context Card */}
        <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-b">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Space</div>
                  <div className="font-semibold text-gray-900">{reservation?.resource_name}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Date</div>
                  <div className="font-semibold text-gray-900">
                    {new Date(reservation?.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Time</div>
                  <div className="font-semibold text-gray-900">{reservation?.start_time} - {reservation?.end_time}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Capacity</div>
                  <div className="font-semibold text-gray-900">{reservation?.people_count || 1} people</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="p-6 bg-white border-b border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('smart')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'smart' 
                    ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Zap className="w-4 h-4" />
                Smart Suggestions
              </button>
              <button
                onClick={() => setViewMode('browse')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'browse' 
                    ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Grid className="w-4 h-4" />
                Browse All
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
              >
                <option value="all">All Categories</option>
                {resourceCategories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {/* Selected Resources */}
          {selectedResources.length > 0 && (
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Selected Resources ({selectedResources.length})
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {selectedResources.map((resource) => (
                  <div key={resource.id} className="bg-white rounded-xl p-4 shadow-sm border border-green-200 transform transition-all duration-200 hover:shadow-md">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{resource.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{resource.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">{resource.rating}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveResource(resource.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 ml-4"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Resources */}
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Available Resources
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              {filteredResources.map((resource) => {
                const isSelected = selectedResources.find(r => r.id === resource.id);
                const category = resourceCategories.find(cat => cat.id === resource.category);
                
                return (
                  <div 
                    key={resource.id} 
                    className={`bg-white rounded-xl p-4 border-2 transition-all duration-200 cursor-pointer transform hover:scale-102 hover:shadow-lg ${
                      isSelected 
                        ? 'border-green-300 bg-green-50' 
                        : resource.available 
                          ? 'border-gray-200 hover:border-blue-300' 
                          : 'border-gray-100 bg-gray-50 opacity-60'
                    }`}
                    onClick={() => resource.available && !isSelected && handleAddResource(resource)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${category?.gradient || 'from-gray-400 to-gray-500'}`}>
                            {category && <category.icon className="w-4 h-4 text-white" />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{resource.name}</h4>
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                              {category?.name}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium text-gray-700">{resource.rating}</span>
                          </div>
                          
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                            resource.available 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {resource.available ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Available
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3" />
                                Unavailable
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="ml-4">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredResources.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No resources found matching your criteria</p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedResources.length} resource{selectedResources.length !== 1 ? 's' : ''} selected
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={selectedResources.length === 0 || loading}
                className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedResources.length === 0 || loading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Resources ({selectedResources.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddResourcesModal;