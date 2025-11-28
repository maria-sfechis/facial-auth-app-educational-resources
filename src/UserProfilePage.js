// UserProfilePage.js - Complete implementation
import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Building, Calendar, Clock, Star, 
  Settings, Shield, Trash2, Edit3, Save, X, AlertTriangle,
  CheckCircle, Eye, EyeOff, Camera, Bell, MapPin, BarChart3,
  ArrowLeft, Loader, Info, UserCheck
} from 'lucide-react';
import { API_CONFIG } from './config.js';

const UserProfilePage = ({ currentUser, onBackToDashboard, onAccountDeleted, onUserUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [deletionImpact, setDeletionImpact] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    department: '',
    phone: '',
    notification_preferences: {
      email: true,
      browser: true,
      reminder_time: 30
    }
  });

  useEffect(() => {
    loadUserProfile();
    loadUserStats();
  }, [currentUser.id]);

  useEffect(() => {
    if (profileData) {
      setEditForm({
        name: profileData.name || '',
        email: profileData.email || '',
        department: profileData.department || '',
        phone: profileData.phone || '',
        notification_preferences: profileData.notification_preferences || {
          email: true,
          browser: true,
          reminder_time: 30
        }
      });
    }
  }, [profileData]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_CONFIG.getApiUrl(`/users/${currentUser.id}/profile`));
      if (response.ok) {
        const profile = await response.json();
        setProfileData(profile);
      } else {
        setError('Failed to load user profile');
      }
    } catch (error) {
      setError('Failed to load user profile');
      console.error('Failed to load user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await fetch(API_CONFIG.getApiUrl(`/users/${currentUser.id}/stats`));
      if (response.ok) {
        const stats = await response.json();
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const loadDeletionImpact = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_CONFIG.getApiUrl(`/users/${currentUser.id}/deletion-impact`));
      if (response.ok) {
        const impact = await response.json();
        setDeletionImpact(impact);
      } else {
        setError('Failed to load account deletion information');
      }
    } catch (error) {
      setError('Failed to load account deletion information');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API_CONFIG.getApiUrl(`/users/${currentUser.id}/profile`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedUser = await response.json();
      setProfileData(updatedUser);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Update parent component
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (reason = '') => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API_CONFIG.getApiUrl(`/users/${currentUser.id}/account`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason || 'User requested account deletion'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }

      const result = await response.json();
      
      // Show success message
      let message = 'Account deleted successfully!';
      if (result.details.reservations_cancelled > 0) {
        message += `\n\n${result.details.reservations_cancelled} reservations were cancelled and made available again.`;
      }
      
      alert(message);
      
      // Call parent callback
      if (onAccountDeleted) {
        onAccountDeleted();
      }

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const DeleteConfirmationModal = () => {
    const [deleteReason, setDeleteReason] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const [step, setStep] = useState(1); // 1: Load impact, 2: Confirm deletion

    useEffect(() => {
      if (showDeleteConfirm && !deletionImpact) {
        loadDeletionImpact();
      }
    }, [showDeleteConfirm]);

    const isConfirmDisabled = confirmText.toUpperCase() !== 'DELETE';

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account</h3>
            <p className="text-gray-600">
              This action cannot be undone. All your data will be permanently removed.
            </p>
          </div>

          {loading && !deletionImpact && (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading account information...</span>
            </div>
          )}

          {deletionImpact && (
            <div className="bg-red-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-red-800 mb-2">What will be deleted:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Your account and all personal data</li>
                <li>• {deletionImpact.impact.reservations_to_cancel} active/future reservations (will be cancelled)</li>
                <li>• {deletionImpact.impact.favorites_count} saved favorites</li>
                <li>• All access history ({deletionImpact.impact.access_logs_count} log entries)</li>
              </ul>
              
              {deletionImpact.impact.reservations_to_cancel > 0 && (
                <div className="mt-3 p-3 bg-red-100 rounded">
                  <p className="font-medium text-red-800 text-xs">Upcoming reservations that will be cancelled:</p>
                  <div className="mt-2 space-y-1">
                    {deletionImpact.impact.reservations.slice(0, 3).map((res, idx) => (
                      <div key={idx} className="text-xs text-red-700">
                        {res.resource} on {res.date} at {res.time}
                      </div>
                    ))}
                    {deletionImpact.impact.reservations.length > 3 && (
                      <div className="text-xs text-red-600">
                        +{deletionImpact.impact.reservations.length - 3} more reservations
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for deletion (optional):
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows="3"
                placeholder="Help us improve by telling us why you're leaving..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "DELETE" to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Type DELETE here"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeletionImpact(null);
                setDeleteReason('');
                setConfirmText('');
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDeleteAccount(deleteReason)}
              disabled={isConfirmDisabled || loading}
              className={`flex-1 px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold border-2 ${
                isConfirmDisabled || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400'
                  : 'bg-red-500 text-black hover:bg-red-600 hover:text-white border-red-600'
              }`}
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToDashboard}
              className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
              <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {isEditing ? (
                    <>
                      <X className="w-4 h-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </>
                  )}
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <input
                      type="text"
                      value={editForm.department}
                      onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Computer Science"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., +1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Notification Preferences</label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="email-notifications"
                          checked={editForm.notification_preferences.email}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            notification_preferences: {
                              ...prev.notification_preferences,
                              email: e.target.checked
                            }
                          }))}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="email-notifications" className="text-sm text-gray-700">
                          Email notifications
                        </label>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="browser-notifications"
                          checked={editForm.notification_preferences.browser}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            notification_preferences: {
                              ...prev.notification_preferences,
                              browser: e.target.checked
                            }
                          }))}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="browser-notifications" className="text-sm text-gray-700">
                          Browser notifications
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-700 min-w-0">
                          Reminder time (minutes before):
                        </label>
                        <select
                          value={editForm.notification_preferences.reminder_time}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            notification_preferences: {
                              ...prev.notification_preferences,
                              reminder_time: parseInt(e.target.value)
                            }
                          }))}
                          className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={120}>2 hours</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {profileData && (
                    <>
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium">{profileData.name}</div>
                          <div className="text-sm text-gray-500">Full Name</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium">{profileData.email}</div>
                          <div className="text-sm text-gray-500">Email Address</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <UserCheck className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium">{profileData.student_id}</div>
                          <div className="text-sm text-gray-500">Student ID</div>
                        </div>
                      </div>

                      {profileData.department && (
                        <div className="flex items-center gap-3">
                          <Building className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="font-medium">{profileData.department}</div>
                            <div className="text-sm text-gray-500">Department</div>
                          </div>
                        </div>
                      )}

                      {profileData.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="font-medium">{profileData.phone}</div>
                            <div className="text-sm text-gray-500">Phone Number</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-200">
              <h2 className="text-lg font-semibold text-red-800 mb-4">Danger Zone</h2>
              
              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="font-medium text-red-800 mb-2">Delete Account</h3>
                <p className="text-sm text-red-600 mb-4">
                  Once you delete your account, there is no going back. 
                  This action cannot be undone.
                  All your active reservations will be cancelled and made available for others.
                </p>
                
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-black font-semibold rounded-lg hover:bg-red-600 hover:text-white transition-all duration-200 border-2 border-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Overview</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <div>
                    <div className="font-medium">Member since</div>
                    <div className="text-sm text-gray-500">
                      {profileData && new Date(profileData.registered_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium">Last login</div>
                    <div className="text-sm text-gray-500">
                      {profileData?.last_login 
                        ? new Date(profileData.last_login).toLocaleDateString()
                        : 'Never'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            {userStats && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Reservations</span>
                    <span className="font-semibold">{userStats.reservations.total_reservations}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Completed</span>
                    <span className="font-semibold text-green-600">{userStats.reservations.completed_reservations}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active</span>
                    <span className="font-semibold text-blue-600">{userStats.reservations.active_reservations}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Upcoming</span>
                    <span className="font-semibold text-purple-600">{userStats.reservations.upcoming_reservations}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Favorites</span>
                    <span className="font-semibold text-yellow-600">{userStats.favorites.favorites_count}</span>
                  </div>
                </div>

                {userStats.most_used_resources.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-3">Most Used Resources</h3>
                    <div className="space-y-2">
                      {userStats.most_used_resources.map((resource, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{resource.resource_type}</span>
                          <span className="font-medium">{resource.usage_count} times</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && <DeleteConfirmationModal />}
      </div>
    </div>
  );
};

export default UserProfilePage;