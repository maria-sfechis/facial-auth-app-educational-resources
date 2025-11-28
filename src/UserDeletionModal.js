// UserDeletionModal.js - React Component
import React, { useState, useEffect } from 'react';
import { AlertTriangle, User, Calendar, Heart, Activity, Trash2, Shield, Download } from 'lucide-react';

const UserDeletionModal = ({ isOpen, onClose, currentUser, onUserDeleted }) => {
  const [deletionImpact, setDeletionImpact] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [exportData, setExportData] = useState(false);
  const [step, setStep] = useState(1); // 1: Impact, 2: Confirmation, 3: Final

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchDeletionImpact();
    }
  }, [isOpen, currentUser]);

  const fetchDeletionImpact = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${currentUser.id}/deletion-impact`);
      const impact = await response.json();
      setDeletionImpact(impact);
    } catch (error) {
      console.error('Error fetching deletion impact:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDataExport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${currentUser.id}/export-data`);
      const data = await response.blob();
      
      // Create download
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user_data_${currentUser.student_id}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setExportData(true);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (confirmationText !== currentUser.email) {
      alert('Please type your email address exactly to confirm deletion.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${currentUser.id}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          confirmEmail: confirmationText,
          exportRequested: exportData 
        })
      });

      if (response.ok) {
        alert('Account deleted successfully. You will be logged out.');
        onUserDeleted();
      } else {
        const error = await response.json();
        alert(`Deletion failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Deletion error:', error);
      alert('Account deletion failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Delete Account</h2>
              <p className="text-red-600 font-medium">This action cannot be undone</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">⚠️ Before you proceed</h3>
                <p className="text-gray-700">
                  Deleting your account will permanently remove all your data from our system. 
                  Please review what will be affected:
                </p>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Analyzing account impact...</p>
                </div>
              ) : deletionImpact && (
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Account Information</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="font-medium">Name:</span> {deletionImpact.user.name}</div>
                      <div><span className="font-medium">Email:</span> {deletionImpact.user.email}</div>
                      <div><span className="font-medium">Student ID:</span> {deletionImpact.user.student_id}</div>
                      <div><span className="font-medium">Member since:</span> {new Date(deletionImpact.user.registered_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Reservations Impact */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="w-5 h-5 text-orange-600" />
                      <h4 className="font-semibold text-gray-900">Active Reservations</h4>
                    </div>
                    {deletionImpact.impact.reservations_to_cancel > 0 ? (
                      <div>
                        <p className="text-orange-700 mb-2">
                          <strong>{deletionImpact.impact.reservations_to_cancel}</strong> active/upcoming reservations will be cancelled:
                        </p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {deletionImpact.impact.reservations.map((res, idx) => (
                            <div key={idx} className="text-sm bg-white p-2 rounded border">
                              <strong>{res.resource}</strong> ({res.type}) - {res.date} {res.time}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-green-700">✅ No active reservations to cancel</p>
                    )}
                  </div>

                  {/* Favorites & Logs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-4 h-4 text-purple-600" />
                        <h5 className="font-semibold text-gray-900">Favorites</h5>
                      </div>
                      <p className="text-sm text-gray-700">
                        {deletionImpact.impact.favorites_count} saved favorites will be removed
                      </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-gray-600" />
                        <h5 className="font-semibold text-gray-900">Access History</h5>
                      </div>
                      <p className="text-sm text-gray-700">
                        {deletionImpact.impact.access_logs_count} access log entries will be deleted
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Export Option */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Download className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">Export Your Data (Optional)</h4>
                </div>
                <p className="text-gray-700 mb-3">
                  Download a copy of all your account data before deletion. This includes your reservations history, 
                  preferences, and account information.
                </p>
                <button
                  onClick={handleDataExport}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {exportData ? '✅ Data Exported' : 'Export My Data'}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  Continue to Delete
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Final Confirmation Required</h3>
                <p className="text-gray-600">
                  To confirm account deletion, please type your email address exactly as shown:
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <code className="text-sm font-mono text-gray-800">{currentUser.email}</code>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type your email to confirm:
                </label>
                <input
                  type="email"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">⚠️ This will permanently:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Delete your account and profile</li>
                  <li>• Cancel all active reservations</li>
                  <li>• Remove your biometric data</li>
                  <li>• Clear your preferences and favorites</li>
                  <li>• Delete your access history</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 font-medium"
                >
                  ← Back
                </button>
                <button
                  onClick={handleAccountDeletion}
                  disabled={loading || confirmationText !== currentUser.email}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {loading ? 'Deleting...' : 'Delete Account Forever'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Backend API Endpoints to add to server.js

// Get deletion impact
app.get('/api/users/:userId/deletion-impact', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user info
    const [users] = await dbAsync.query(
      'SELECT name, email, student_id, registered_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get active/upcoming reservations
    const [reservations] = await dbAsync.query(`
      SELECT resource_name, resource_type, date, start_time, end_time, status
      FROM reservations 
      WHERE user_id = ? 
      AND (status = 'active' OR status = 'pending' OR (date >= CURDATE()))
      ORDER BY date, start_time
    `, [userId]);

    // Get user favorites
    const [favorites] = await dbAsync.query(`
      SELECT r.name, r.category 
      FROM user_favorites uf
      JOIN resources r ON uf.resource_id = r.id
      WHERE uf.user_id = ?
    `, [userId]);

    // Get access logs count
    const [[{ logCount }]] = await dbAsync.query(
      'SELECT COUNT(*) as logCount FROM access_logs WHERE user_id = ?',
      [userId]
    );

    res.json({
      user: users[0],
      impact: {
        reservations_to_cancel: reservations.length,
        reservations: reservations.map(r => ({
          resource: r.resource_name,
          type: r.resource_type,
          date: r.date,
          time: `${r.start_time}-${r.end_time}`,
          status: r.status
        })),
        favorites_count: favorites.length,
        access_logs_count: logCount
      }
    });

  } catch (error) {
    console.error('❌ Deletion impact check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export user data
app.get('/api/users/:userId/export-data', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get all user data
    const [user] = await dbAsync.query(
      'SELECT id, name, email, student_id, department, phone, registered_at, last_login FROM users WHERE id = ?',
      [userId]
    );
    
    const [reservations] = await dbAsync.query(
      'SELECT * FROM reservations WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    const [favorites] = await dbAsync.query(`
      SELECT r.name, r.category, uf.created_at 
      FROM user_favorites uf
      JOIN resources r ON uf.resource_id = r.id
      WHERE uf.user_id = ?
    `, [userId]);
    
    const [accessLogs] = await dbAsync.query(
      'SELECT action, resource_type, timestamp, success FROM access_logs WHERE user_id = ? ORDER BY timestamp DESC',
      [userId]
    );

    const exportData = {
      export_info: {
        exported_at: new Date().toISOString(),
        user_id: userId,
        export_version: '1.0'
      },
      user_profile: user[0],
      reservations_history: reservations,
      favorites: favorites,
      access_logs: accessLogs.slice(0, 1000) // Limit to last 1000 logs
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user_data_${user[0].student_id}.json"`);
    res.json(exportData);

  } catch (error) {
    console.error('❌ Data export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete user account
app.delete('/api/users/:userId/delete', async (req, res) => {
  const connection = await dbAsync.getConnection();
  
  try {
    const { userId } = req.params;
    const { confirmEmail } = req.body;
    
    await connection.beginTransaction();
    
    // Verify user and email
    const [users] = await connection.query(
      'SELECT email FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      throw new Error('User not found');
    }
    
    if (users[0].email !== confirmEmail) {
      throw new Error('Email confirmation does not match');
    }
    
    // Delete in order to respect foreign key constraints
    await connection.query('DELETE FROM access_logs WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM user_favorites WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM ratings WHERE user_id = ?', [userId]);
    
    // Cancel and delete reservations
    await connection.query('UPDATE reservations SET status = "Cancelled" WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM reservations WHERE user_id = ?', [userId]);
    
    // Delete OTP codes
    await connection.query('DELETE FROM otp_codes WHERE user_id = ?', [userId]);
    
    // Finally delete user
    await connection.query('DELETE FROM users WHERE id = ?', [userId]);
    
    await connection.commit();
    
    console.log(`✅ User ${userId} successfully deleted`);
    res.json({ success: true, message: 'Account deleted successfully' });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Account deletion error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

export default UserDeletionModal;