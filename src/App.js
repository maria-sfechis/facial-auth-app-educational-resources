import './App.css';
import { API_CONFIG } from './config.js';
import HeroLandingPage from './HeroLandingPage.js';
import faceRecognitionService from './faceRecognitionService.js';
import reservationService from './reservationService.js';
import ReservationModal from './ReservationModal';
import AddResourcesModal from './AddResourcesModal.js';
import ResourceDetailModal from './ResourceDetailModal.js';
import QRCodeDisplay from './QRCodeDisplay.js';
import FilterReservationModal from './FilterReservationModal.js';
import MapsDashboardComponent from './MapsDashboardComponent';
import BuildingSelectorComponent from './BuildingSelectorComponent';
import ClujUniversityMapsService from './clujUniversityMapsService';
import UserProfilePage from './UserProfilePage.js';
import ReservationView from './ReservationView.js';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, Calendar, Clock, MapPin, User, Star, Menu, X, QrCode, Edit, Trash2, ChevronRight, Monitor,
  BookOpen, Laptop, Presentation, FileText, Package, Users, GraduationCap, Cpu, Headphones, Plus, Info,
  CheckCircle, AlertCircle, UserCheck, ChevronLeft, Book, Mail, Shield, Search, Filter, Loader,Building
} from 'lucide-react';

// Error Boundary Component
const FaceRecognitionErrorBoundary = ({ children, currentUser }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);

  useEffect(() => {
    const handleError = (event) => {
      const error = event.error || event.reason || new Error('Unknown error');
      console.error('🚨 Face Recognition Error:', error);
      setHasError(true);
      setError(error);
      setErrorInfo(event.stack || error.stack);
      
      // Log to backend for debugging
      if (faceRecognitionService && typeof faceRecognitionService.logAccessToBackend === 'function') {
        faceRecognitionService.logAccessToBackend(
          currentUser?.id || 'unknown',
          'error_occurred',
          { 
            error: error.message,
            stack: error.stack,
            deviceInfo: faceRecognitionService.getDeviceInfo ? faceRecognitionService.getDeviceInfo() : {}
          }
        ).catch(console.warn);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, [currentUser]);

  if (hasError) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200">
        <div className="text-red-600 mb-4">
          <AlertCircle className="w-12 h-12 mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">Face Recognition Error</h3>
          <p className="text-sm mb-4">
            Something went wrong with the face recognition system.
          </p>
          {error && (
            <details className="text-left bg-red-100 p-3 rounded mb-4">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="text-xs mt-2 whitespace-pre-wrap">{error.message}</pre>
              {errorInfo && <pre className="text-xs mt-1 whitespace-pre-wrap">{errorInfo}</pre>}
            </details>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setHasError(false);
              setError(null);
              setErrorInfo(null);
              window.location.reload();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Reload Page
          </button>
          <button
            onClick={() => {
              setHasError(false);
              setError(null);
              setErrorInfo(null);
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  return children;
};

const EmailOTPLogin = ({ onLogin, onBack }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: Code
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@student\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && !email.includes(' ');
  };

  const sendCode = async () => {
    if (!validateEmail(email)) {
      alert('Please enter a valid university email (@student format)');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending code...')
      const response = await fetch(API_CONFIG.getApiUrl('/auth/send-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStep(2);
        setCountdown(60);
        
        // Start countdown
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        alert('✅ Verification code sent to your email!');
      } else {
        alert(data.error || 'Failed to send code');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
    setLoading(false);
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      alert('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_CONFIG.getApiUrl('/auth/verify-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), code })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Success - login the user
        onLogin(data.user);
      } else {
        // Handle different error types
        if (data.errorType === 'incorrect_code') {
          // Just show error, don't go back to step 1
          alert(`❌ ${data.error}`);
          setCode(''); // Clear the code input for retry
        } else if (data.errorType === 'too_many_attempts') {
          // Too many attempts - go back to step 1
          alert(`❌ ${data.error}`);
          setStep(1);
          setCode('');
        } else if (data.errorType === 'expired_or_not_found') {
          // Code expired - go back to step 1
          alert(`⏰ ${data.error}`);
          setStep(1);
          setCode('');
        } else {
          // Generic error
          alert(`❌ ${data.error || 'Invalid or expired code'}`);
          setCode(''); // Clear code but stay on step 2
        }
      }
    } catch (error) {
      alert('❌ Network error. Please try again.');
      setCode(''); // Clear code but stay on step 2
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {step === 1 ? (
        <>
          {/* Step 1: Enter Email */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 relative overflow-hidden" 
                 style={{ 
                   background: 'linear-gradient(135deg, #7986cb 0%, #64b5f6 100%)',
                   boxShadow: '0 10px 15px -3px rgba(121, 134, 203, 0.3)'
                 }}>
              <Mail className="w-8 h-8 text-white relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/20"></div>
            </div>
            <h3 className="text-2xl font-bold mb-2" style={{ 
              background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}>
              📧 Login with Email Code
            </h3>
            <p className="text-gray-600 font-medium">
              We'll send a verification code to your university email
            </p>
          </div>

          <input
            type="email"
            placeholder="Enter your university email"
            value={email}
            onChange={(e) => {
              const value = e.target.value;
              if (!value.includes(' ')) { // Prevent spaces
                setEmail(value);
              }
            }}
            className="w-full px-5 py-4 rounded-xl text-gray-800 font-medium placeholder-gray-500 focus:outline-none focus:ring-0 input-glass border-2 border-white/30 focus:border-indigo-400"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
          
          <button
            onClick={sendCode}
            disabled={!email || loading || !validateEmail(email)}
            className="w-full text-white py-4 px-6 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            style={{
              background: validateEmail(email) 
                ? 'linear-gradient(135deg, #7986cb 0%, #64b5f6 100%)' 
                : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
              boxShadow: validateEmail(email) 
                ? '0 10px 15px -3px rgba(121, 134, 203, 0.3)' 
                : 'none'
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending Code...
              </div>
            ) : (
              '📨 Send Verification Code'
            )}
          </button>
        </>
      ) : (
        <>
          {/* Step 2: Enter Code */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 relative overflow-hidden" 
                 style={{ 
                   background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                   boxShadow: '0 10px 15px -3px rgba(34, 197, 94, 0.3)'
                 }}>
              <Shield className="w-8 h-8 text-white relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/20"></div>
            </div>
            <h3 className="text-2xl font-bold mb-2" style={{ 
              background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}>
              🔢 Enter Verification Code
            </h3>
            <p className="text-gray-600 font-medium">
              Code sent to <span className="font-semibold text-indigo-600">{email}</span>
            </p>
          </div>

          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full px-5 py-4 rounded-xl text-gray-800 font-bold placeholder-gray-500 focus:outline-none focus:ring-0 text-center text-2xl tracking-[0.5em] input-glass border-2 border-white/30 focus:border-green-400"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            maxLength="6"
            autoFocus
          />

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    i < code.length 
                      ? 'bg-green-500 shadow-lg' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500">
              {code.length}/6 digits entered
            </p>
          </div>
          
          <button
            onClick={verifyCode}
            disabled={code.length !== 6 || loading}
            className="w-full text-white py-4 px-6 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            style={{
              background: code.length === 6 
                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
                : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
              boxShadow: code.length === 6 
                ? '0 10px 15px -3px rgba(34, 197, 94, 0.3)' 
                : 'none'
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Verifying...
              </div>
            ) : (
              '✅ Verify & Login'
            )}
          </button>

          <div className="flex justify-between items-center text-sm">
            <button
              onClick={() => {
                setStep(1);
                setCode('');
                setCountdown(0);
              }}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Change Email
            </button>
            <button
              onClick={sendCode}
              disabled={countdown > 0 || loading}
              className="text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
            >
              {countdown > 0 ? `Resend in ${countdown}s` : '🔄 Resend Code'}
            </button>
          </div>
        </>
      )}
      
      <button
        onClick={onBack}
        className="w-full py-3 px-6 rounded-xl font-semibold btn-secondary-glass"
        style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(121, 134, 203, 0.3)',
          color: '#5c6bc0',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        ← Back to Face Recognition
      </button>
    </div>
  );
};

const FacialAuthEducationSystem = () => {
  const [showHeroPage, setShowHeroPage] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(0);
  const [facePosition, setFacePosition] = useState('center');
  const [videoSize, setVideoSize] = useState({width: 400, height: 300 });
  const [isMobile, setIsMobile] = useState(false);
  const [showMapsView, setShowMapsView] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [mapsApiAvailable, setMapsApiAvailable] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [buildingsCache, setBuildingsCache] = useState(null);
  const [lastCacheUpdate, setLastCacheUpdate] = useState(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const [formErrors, setFormErrors] = useState({ name: '', email: '', studentId: '' });
  const [studentIdChecking, setStudentIdChecking] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: ''
  });
  //Face recognition state
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const isRegisteringRef = useRef(false);

  // Mock data for reservations
  const [reservations, setReservations] = useState([
    {
      id: 1,
      type: 'Study Room',
      name: 'Room A-201',
      date: '2025-05-30',
      time: '14:00-16:00',
      qrCode: 'QR-A201-20250530'
    }
  ]);

  const [resources] = useState({
    'Study Rooms': [
      { id: 1, name: 'Room A-201', capacity: 6, available: true, location: 'Building A, Floor 2', building: 'MAIN', buildingName: 'Clădirea Centrală UTCN', amenities: ['Whiteboard', 'Projector'] },
      { id: 2, name: 'Room A-202', capacity: 4, available: true, location: 'Building A, Floor 2', building: 'MAIN', buildingName: 'Clădirea Centrală UTCN', amenities: ['Whiteboard'] },
      { id: 3, name: 'Room B-101', capacity: 8, available: true, location: 'Building B, Floor 1', building: 'AC', buildingName: 'Facultatea de Automatică și Calculatoare', amenities: ['Whiteboard', 'Computer'] },
      { id: 4, name: 'Room B-102', capacity: 10, available: true, location: 'Building B, Floor 1', building: 'AC', buildingName: 'Facultatea de Automatică și Calculatoare', amenities: ['Whiteboard', 'Projector', 'Computer'] },
      { id: 5, name: 'Room C-301', capacity: 3, available: true, location: 'Building C, Floor 3', building: 'IE', buildingName: 'Facultatea de Inginerie Electrică', amenities: ['Whiteboard'] },
      { id: 6, name: 'Conference Room D-401', capacity: 20, available: true, location: 'Building D, Floor 4', building: 'RES', buildingName: 'Centrul de Cercetare și Inovare', amenities: ['Whiteboard', 'Projector', 'Video Conference'] },
      { id: 7, name: 'Study Pod E-101', capacity: 2, available: true, location: 'Building E, Floor 1', building: 'LIB', buildingName: 'Biblioteca Centrală Universitară', amenities: ['Quiet Space', 'Power Outlets'] },
      { id: 8, name: 'Group Study F-205', capacity: 8, available: true, location: 'Building F, Floor 2', building: 'REC-CULT', buildingName: 'Centrul Cultural Studențesc', amenities: ['Whiteboard', 'Smart TV'] }
    ],
    'Computer Labs': [
      { id: 9, name: 'Lab 1 - Programming', computers: 30, capacity: 30, available: true, location: 'Tech Building, Floor 1', building: 'AC', buildingName: 'Facultatea de Automatică și Calculatoare', amenities: ['High-spec PCs', 'Development Software'] },
      { id: 10, name: 'Lab 2 - Design', computers: 25, capacity: 25, available: true, location: 'Tech Building, Floor 2', building: 'AC', buildingName: 'Facultatea de Automatică și Calculatoare', amenities: ['Graphics Workstations', 'Design Software'] },
      { id: 11, name: 'Lab 3 - Data Science', computers: 20, capacity: 20, available: true, location: 'Tech Building, Floor 3', building: 'RES', buildingName: 'Centrul de Cercetare și Inovare', amenities: ['AI/ML Software', 'GPUs'] },
      { id: 12, name: 'Lab 4 - Web Development', computers: 18, capacity: 18, available: true, location: 'Innovation Center, Floor 1', building: 'RES', buildingName: 'Centrul de Cercetare și Inovare', amenities: ['Modern PCs', 'Multiple Monitors'] },
      { id: 13, name: 'Lab 5 - Mobile Development', computers: 15, capacity: 15, available: true, location: 'Innovation Center, Floor 2', building: 'RES', buildingName: 'Centrul de Cercetare și Inovare', amenities: ['Mac & PC', 'Testing Devices'] }
    ],
    'Equipment': [
      { id: 14, name: 'Projector Cart A', quantity: 3, capacity: 1, available: true, location: 'Equipment Room A-001', building: 'MAIN', buildingName: 'Clădirea Centrală UTCN', amenities: ['HD Projector', 'Laptop Compatible', 'Remote'] },
      { id: 15, name: 'Projector Cart B', quantity: 2, capacity: 1, available: true, location: 'Equipment Room B-001', building: 'AC', buildingName: 'Facultatea de Automatică și Calculatoare', amenities: ['4K Projector', 'Wireless', 'Sound System'] },
      { id: 16, name: 'Portable Whiteboard', quantity: 5, capacity: 1, available: true, location: 'Equipment Storage', building: 'MAIN', buildingName: 'Clădirea Centrală UTCN', amenities: ['Mobile', 'Double-sided', 'Markers Included'] },
      { id: 17, name: 'Video Camera Kit', quantity: 4, capacity: 1, available: true, location: 'Media Center', building: 'REC-CULT', buildingName: 'Centrul Cultural Studențesc', amenities: ['4K Recording', 'Tripod', 'Memory Cards'] },
      { id: 18, name: 'Audio Equipment Set', quantity: 3, capacity: 1, available: true, location: 'Media Center', building: 'REC-CULT', buildingName: 'Centrul Cultural Studențesc', amenities: ['Microphones', 'Speakers', 'Mixer'] },
      { id: 19, name: 'VR Headset Kit', quantity: 6, capacity: 1, available: true, location: 'Innovation Lab', building: 'RES', buildingName: 'Centrul de Cercetare și Inovare', amenities: ['Latest VR Tech', 'Controllers', 'Charging Station'] },
      { id: 20, name: 'Laptop Cart (20 units)', quantity: 2, capacity: 20, available: true, location: 'Tech Storage', building: 'AC', buildingName: 'Facultatea de Automatică și Calculatoare', amenities: ['20 Laptops', 'Charging', 'Security Lock'] },
      { id: 21, name: '3D Printer', quantity: 3, capacity: 1, available: true, location: 'Maker Space', building: 'RES', buildingName: 'Centrul de Cercetare și Inovare', amenities: ['PLA/ABS Compatible', 'Software Included'] }
    ],
    'Library Resources': [
      { id: 22, name: 'Digital Library Access', type: 'Online', available: true, location: 'Online Platform', building: 'LIB', buildingName: 'Biblioteca Centrală Universitară', amenities: ['24/7 Access', 'Academic Papers'] },
      { id: 23, name: 'Research Database Premium', type: 'Online', available: true, location: 'Online Platform', building: 'LIB', buildingName: 'Biblioteca Centrală Universitară', amenities: ['Industry Reports', 'Statistical Data'] },
      { id: 24, name: 'E-Book Collection', type: 'Online', available: true, location: 'Online Platform', building: 'LIB', buildingName: 'Biblioteca Centrală Universitară', amenities: ['Unlimited Downloads', 'Academic Texts'] },
      { id: 25, name: 'Private Study Booth', quantity: 8, capacity: 1, available: true, location: 'Library Building, Floor 2', building: 'LIB', buildingName: 'Biblioteca Centrală Universitară', amenities: ['Quiet Environment', 'Power Outlets', 'Good Lighting'] },
      { id: 26, name: 'Group Study Area', quantity: 4, capacity: 6, available: true, location: 'Library Building, Floor 1', building: 'LIB', buildingName: 'Biblioteca Centrală Universitară', amenities: ['Collaborative Space', 'Whiteboard', 'Projector'] }
    ],
    'Templates & Tools': [
      { id: 25, name: 'PowerPoint Templates Pack', type: 'Digital', available: true, location: 'Online Platform', building: 'VIRTUAL', buildingName: 'Online Resources', amenities: ['Professional Templates', 'Multiple Themes'] },
      { id: 26, name: 'Research Paper Template', type: 'Digital', available: true, location: 'Online Platform', building: 'LIB', buildingName: 'Biblioteca Centrală Universitară', amenities: ['APA Format', 'Academic Standards'] },
      { id: 27, name: 'Thesis LaTeX Template', type: 'Digital', available: true, location: 'Online Platform', building: 'LIB', buildingName: 'Biblioteca Centrală Universitară', amenities: ['University Format', 'Auto-formatting'] },
      { id: 28, name: 'Project Proposal Template', type: 'Digital', available: true, location: 'Online Platform', building: 'ADMIN-RECT', buildingName: 'Rectorat UTCN', amenities: ['Official Format', 'Guidelines Included'] },
      { id: 29, name: 'Lab Report Template', type: 'Digital', available: true, location: 'Online Platform', building: 'IE', buildingName: 'Facultatea de Inginerie Electrică', amenities: ['Technical Format', 'Data Tables'] },
      { id: 30, name: 'Presentation Poster Template', type: 'Digital', available: true, location: 'Online Platform', building: 'REC-CULT', buildingName: 'Centrul Cultural Studențesc', amenities: ['Academic Posters', 'Multiple Sizes'] }
    ],
    'Software Licenses': [
      { id: 31, name: 'Microsoft Office 365', licenses: 100, available: true, building: 'AC', buildingName: 'Facultatea de Automatică și Calculatoare', amenities: ['Word, Excel, PowerPoint', 'Cloud Storage'] },
      { id: 32, name: 'Adobe Creative Suite', licenses: 50, available: true, building: 'REC-CULT', buildingName: 'Centrul Cultural Studențesc', amenities: ['Photoshop, Illustrator', 'Video Editing'] },
      { id: 33, name: 'MATLAB', licenses: 30, available: true, building: 'IE', buildingName: 'Facultatea de Inginerie Electrică', amenities: ['Engineering Analysis', 'Simulation Tools'] },
      { id: 34, name: 'AutoCAD', licenses: 20, available: true, building: 'ADMIN-FC', buildingName: 'Decanatul Facultății de Construcții', amenities: ['2D/3D Design', 'Architecture Tools'] },
      { id: 35, name: 'SPSS Statistics', licenses: 25, available: true, building: 'LIB', buildingName: 'Biblioteca Centrală Universitară', amenities: ['Statistical Analysis', 'Research Tools'] },
      { id: 36, name: 'Tableau', licenses: 15, available: true, building: 'RES', buildingName: 'Centrul de Cercetare și Inovare', amenities: ['Data Visualization', 'Business Intelligence'] }
    ],
    'Collaboration Spaces': [
      { id: 37, name: 'Virtual Meeting Room 1', type: 'Online', maxUsers: 50, available: true, building: 'VIRTUAL', buildingName: 'Online Platform', amenities: ['Video Conferencing', 'Screen Sharing'] },
      { id: 38, name: 'Virtual Meeting Room 2', type: 'Online', maxUsers: 100, available: true, building: 'VIRTUAL', buildingName: 'Online Platform', amenities: ['Webinar Mode', 'Recording'] },
      { id: 39, name: 'Breakout Room A', type: 'Physical', capacity: 4, available: true, building: 'RES-T1', buildingName: 'Căminul Studențesc T1', amenities: ['Small Group Discussion', 'Whiteboard'] },
      { id: 40, name: 'Breakout Room B', type: 'Physical', capacity: 4, available: true, building: 'RES-T2', buildingName: 'Căminul Studențesc T2', amenities: ['Comfortable Seating', 'TV Display'] },
      { id: 41, name: 'Innovation Hub', type: 'Physical', capacity: 15, available: true, building: 'RES', buildingName: 'Centrul de Cercetare și Inovare', amenities: ['Flexible Workspace', 'Collaboration Tools'] }
    ],
    'Learning Materials': [
      { id: 42, name: 'Video Tutorial Library', type: 'Online', available: true, building: 'LIB', buildingName: 'Biblioteca Centrală Universitară', amenities: ['Course Videos', 'Self-paced Learning'] },
      { id: 43, name: 'Course Notes Repository', type: 'Online', available: true, building: 'LIB', buildingName: 'Biblioteca Centrală Universitară', amenities: ['Lecture Notes', 'Study Guides'] },
      { id: 44, name: 'Practice Exam Bank', type: 'Online', available: true, building: 'ADMIN-SEC', buildingName: 'Secretariat General', amenities: ['Past Exams', 'Answer Keys'] },
      { id: 45, name: 'Interactive Simulations', type: 'Online', available: true, building: 'RES', buildingName: 'Centrul de Cercetare și Inovare', amenities: ['Virtual Labs', 'Interactive Content'] },
      { id: 46, name: 'Coding Playground', type: 'Online', available: true, building: 'AC', buildingName: 'Facultatea de Automatică și Calculatoare', amenities: ['Online IDE', 'Multiple Languages'] }
    ],
    'Special Equipment': [
      { id: 47, name: '3D Printer', quantity: 2, available: true, building: 'RES', buildingName: 'Centrul de Cercetare și Inovare', amenities: ['High Resolution', 'Multiple Materials'] },
      { id: 48, name: 'Laser Cutter', quantity: 1, available: false, building: 'RES', buildingName: 'Centrul de Cercetare și Inovare', amenities: ['Precision Cutting', 'Safety Equipment'] },
      { id: 49, name: 'Electronics Kit', quantity: 10, available: true, building: 'IE', buildingName: 'Facultatea de Inginerie Electrică', amenities: ['Components', 'Breadboards', 'Multimeters'] },
      { id: 50, name: 'Robotics Kit', quantity: 5, available: true, building: 'AC', buildingName: 'Facultatea de Automatică și Calculatoare', amenities: ['Programmable Robots', 'Sensors'] },
      { id: 51, name: 'Arduino Development Kit', quantity: 15, available: true, building: 'AC', buildingName: 'Facultatea de Automatică și Calculatoare', amenities: ['Microcontrollers', 'Sensors', 'Modules'] },
      { id: 52, name: 'Raspberry Pi Kit', quantity: 10, available: true, building: 'AC', buildingName: 'Facultatea de Automatică și Calculatoare', amenities: ['Mini Computers', 'GPIO', 'Cameras'] }
    ],
    'Study Aids': [
      { id: 53, name: 'Noise-Cancelling Headphones', quantity: 20, available: true, building: 'LIB', buildingName: 'Biblioteca Centrală Universitară', amenities: ['Active Noise Cancellation', 'Comfortable'] },
      { id: 54, name: 'Standing Desk Converter', quantity: 10, available: true, building: 'LIB', buildingName: 'Biblioteca Centrală Universitară', amenities: ['Ergonomic', 'Height Adjustable'] },
      { id: 55, name: 'Book Scanner', quantity: 3, available: true, building: 'LIB', buildingName: 'Biblioteca Centrală Universitară', amenities: ['High Resolution', 'Fast Scanning'] },
      { id: 56, name: 'Graphics Tablet', quantity: 8, available: true, building: 'REC-CULT', buildingName: 'Centrul Cultural Studențesc', amenities: ['Digital Art', 'Pressure Sensitive'] },
      { id: 57, name: 'Scientific Calculator', quantity: 25, available: true, building: 'ADMIN-SEC', buildingName: 'Secretariat General', amenities: ['Advanced Functions', 'Graphing'] }
    ],
    'Medical Services': [
      { id: 58, name: 'General Health Consultation', type: 'Service', available: true, building: 'MED-DISP', buildingName: 'Dispensarul Medical UTCN', amenities: ['Licensed Doctors', 'Walk-in Available'] },
      { id: 59, name: 'Dental Services', type: 'Service', available: true, building: 'MED-DISP', buildingName: 'Dispensarul Medical UTCN', amenities: ['Dental Check-up', 'Basic Treatment'] },
      { id: 60, name: 'Psychological Counseling', type: 'Service', available: true, building: 'MED-PSY', buildingName: 'Centrul de Sănătate Mentală', amenities: ['Individual Sessions', 'Group Therapy'] },
      { id: 61, name: 'Mental Health Support', type: 'Service', available: true, building: 'MED-PSY', buildingName: 'Centrul de Sănătate Mentală', amenities: ['Crisis Support', 'Wellness Programs'] }
    ],
    'Recreational Facilities': [
      { id: 62, name: 'Basketball Court', type: 'Facility', available: true, building: 'REC-SPORT', buildingName: 'Sala de Sport UTCN', amenities: ['Full Court', 'Equipment Available'] },
      { id: 63, name: 'Fitness Room', type: 'Facility', available: true, building: 'REC-SPORT', buildingName: 'Sala de Sport UTCN', amenities: ['Modern Equipment', 'Free Weights'] },
      { id: 64, name: 'Theater Hall', type: 'Facility', available: true, building: 'REC-CULT', buildingName: 'Centrul Cultural Studențesc', amenities: ['Stage', 'Sound System', 'Lighting'] },
      { id: 65, name: 'Music Practice Rooms', quantity: 5, available: true, building: 'REC-CULT', buildingName: 'Centrul Cultural Studențesc', amenities: ['Soundproof', 'Piano Available'] },
      { id: 66, name: 'Outdoor Sports Field', type: 'Facility', available: true, building: 'REC-FIELD', buildingName: 'Teren de Sport Exterior', amenities: ['Football Field', 'Running Track'] }
    ]
  });

  // State for reservations
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedResourceType, setSelectedResourceType] = useState('');
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [showAddResourcesModal, setShowAddResourcesModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  // QR Code state
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedQRReservation, setSelectedQRReservation] = useState(null);
  // Filter Reservation states
  const [showFilterReservationModal, setShowFilterReservationModal] = useState(false);
  const [filterBasedSearch, setFilterBasedSearch] = useState(false);
  // Resource detail modal state
  const [showResourceDetailModal, setShowResourceDetailModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedResourceCategory, setSelectedResourceCategory] = useState('');

  // Reservation filters state
  const [reservationFilters, setReservationFilters] = useState({
    date: new Date().toISOString().split('T')[0], // Today's date
    startTime: '',
    endTime: '',
    minCapacity: '',
    category: '',
    buildingCode: ''
  });

  // API-based resources state
  const [apiResources, setApiResources] = useState({});
  const [loadingResources, setLoadingResources] = useState(false);

  useEffect(() => {
    // Forțează afișarea HeroLandingPage la startup
    console.log('🚀 App started - showing HeroLandingPage');
    setShowHeroPage(true);
    setIsAuthenticated(false);
  }, []); // Rulează doar o dată la început

  useEffect(() => {
    const hasSeenHero = localStorage.getItem('hasSeenHero');
    if (hasSeenHero === 'true') {
      setShowHeroPage(true);
    }
  }, []);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const initializeMapsService = async () => {
      try {
        // Check if API is available
        const apiAvailable = await ClujUniversityMapsService.checkApiAvailability();
        setMapsApiAvailable(apiAvailable);
        
        if (apiAvailable) {
          // Load and cache buildings data
          const cached = localStorage.getItem('buildings_cache');
          const cacheTime = localStorage.getItem('buildings_cache_time');
          
          if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_DURATION) {
            // Use cached data
            setBuildingsCache(JSON.parse(cached));
            setLastCacheUpdate(parseInt(cacheTime));
            console.log('🗺️ Using cached buildings data');
          } else {
            // Fetch fresh data
            console.log('🗺️ Fetching fresh buildings data...');
            const buildings = await ClujUniversityMapsService.getAllBuildings();
            setBuildingsCache(buildings);
            setLastCacheUpdate(Date.now());
            
            // Cache the data
            localStorage.setItem('buildings_cache', JSON.stringify(buildings));
            localStorage.setItem('buildings_cache_time', Date.now().toString());
            console.log('✅ Buildings data cached successfully');
          }
        }
      } catch (error) {
        console.warn('⚠️ Maps service initialization failed:', error);
        setMapsApiAvailable(false);
      }
    };
    initializeMapsService();
  }, []);

  useEffect(() => {
  // Clear expired cache on app start
    const clearExpiredCache = () => {
      const now = Date.now();
      const keys = Object.keys(localStorage);
    
      keys.forEach(key => {
        if (key.startsWith('buildings_cache') || key.startsWith('resources_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data.timestamp && (now - data.timestamp) > 30 * 60 * 1000) { // 30 minutes
              localStorage.removeItem(key);
            }
          } catch (e) {
            localStorage.removeItem(key);
          }
        }
      });
    };

    clearExpiredCache();
    const cleanupInterval = setInterval(() => {
      clearExpiredCache();
    }, 10 * 60 * 1000) // Every 10 minutes
    return () => clearInterval(cleanupInterval);
  }, []);

  // Model loading with progress indication
  useEffect(() => {
    const loadModels = async () => {
      console.log('🔄 Starting model loading...');
      setDetectionMessage('Loading face recognition models...');
      
      try {
        const loaded = await faceRecognitionService.loadModels();
        setModelsLoaded(loaded);
        
        if (loaded) {
          console.log('✅ Enhanced face recognition models loaded successfully!');
          setDetectionMessage('Face recognition ready!');
          
          // Log device info for debugging
          console.log('📱 Device Info:', faceRecognitionService.getDeviceInfo());
        } else {
          setDetectionMessage('Failed to load face recognition models');
        }
      } catch (error) {
        console.error('❌ Model loading error:', error);
        setDetectionMessage('Error loading face recognition models');
      }
    };
    
    loadModels();
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const fetchUserReservations = useCallback(async () => {
    if (!currentUser?.id) return;

    setLoadingReservations(true);
    try {
      const userReservations = await reservationService.getUserReservations(currentUser.id);
      setReservations(userReservations);
    } catch (error) {
      console.error('Error fetching reservations: ', error);
    } finally {
      setLoadingReservations(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchUserReservations();
    }
  }, [isAuthenticated, currentUser, fetchUserReservations]);

  // Fetch resources from API
  const fetchResources = async () => {
    setLoadingResources(true);
    try {
      const params = new URLSearchParams();
      if (reservationFilters.date) params.append('date', reservationFilters.date);
      if (reservationFilters.startTime) params.append('startTime', reservationFilters.startTime);
      if (reservationFilters.endTime) params.append('endTime', reservationFilters.endTime);
      if (reservationFilters.category) params.append('category', reservationFilters.category);
      if (reservationFilters.minCapacity) params.append('minCapacity', reservationFilters.minCapacity);
      if (reservationFilters.buildingCode) params.append('buildingCode', reservationFilters.buildingCode);

      const response = await fetch(`${API_CONFIG.getApiUrl('/resources')}?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setApiResources(data.resources || {});
        if (data.resources) {
          const cacheKey = `resources_${params.toString()}`;
          const cacheData = {
            resources: data.resources,
            timestamp: Date.now()
          };
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        }
      } else {
        console.error('Error fetching resources:', data.error);
        // Fallback to hardcoded resources if API fails
        setApiResources(resources);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      // Fallback to hardcoded resources if API fails
      setApiResources(resources);
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchResources();
    }
  }, [reservationFilters.date, reservationFilters.startTime, reservationFilters.endTime, reservationFilters.category, reservationFilters.minCapacity, reservationFilters.buildingCode, isAuthenticated]);

const tooltipStyles = `
  .tooltip-container {
    position: relative;
    display: inline-block;
  }
  
  .tooltip-container .tooltip {
    visibility: hidden;
    width: 320px;
    background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
    color: white;
    text-align: left;
    border-radius: 12px;
    padding: 16px;
    position: absolute;
    z-index: 1000;
    top: -10px;
    right: 35px;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 13px;
    line-height: 1.6;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .tooltip-container .tooltip::before {
    content: "";
    position: absolute;
    top: 24px;
    left: 100%;
    margin-top: -8px;
    border-width: 8px;
    border-style: solid;
    border-color: transparent transparent transparent #374151;
    filter: drop-shadow(2px 0 4px rgba(0, 0, 0, 0.1));
  }
  
  .tooltip-container:hover .tooltip {
    visibility: visible;
    opacity: 1;
    transform: translateX(-4px);
  }
  
  .form-card-gradient {
    background: linear-gradient(135deg, 
      rgba(255, 255, 255, 0.9) 0%, 
      rgba(255, 255, 255, 0.8) 50%, 
      rgba(248, 250, 252, 0.9) 100%);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 
      0 25px 50px -12px rgba(0, 0, 0, 0.15),
      0 0 0 1px rgba(255, 255, 255, 0.05);
  }
  
  .input-glass {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .input-glass:focus {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(16px);
    border-color: #7986cb;
    transform: translateY(-1px);
    box-shadow: 
      0 10px 15px -3px rgba(121, 134, 203, 0.2),
      0 4px 6px -2px rgba(121, 134, 203, 0.1);
  }
  
  .input-glass:hover:not(:focus) {
    background: rgba(255, 255, 255, 0.8);
    transform: translateY(-1px);
  }
  
  .input-valid {
    border-color: #22c55e !important;
  }
  
  .input-invalid {
    border-color: #ef4444 !important;
  }
  
  .btn-primary-gradient {
    background: linear-gradient(135deg, #7986cb 0%, #64b5f6 100%);
    box-shadow: 
      0 10px 15px -3px rgba(121, 134, 203, 0.3),
      0 4px 6px -2px rgba(121, 134, 203, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .btn-primary-gradient:hover:not(:disabled) {
    background: linear-gradient(135deg, #5c6bc0 0%, #42a5f5 100%);
    transform: translateY(-2px);
    box-shadow: 
      0 20px 25px -5px rgba(121, 134, 203, 0.4),
      0 10px 10px -5px rgba(121, 134, 203, 0.3);
  }
  
  .btn-secondary-glass {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(121, 134, 203, 0.3);
    color: #5c6bc0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .btn-secondary-glass:hover {
    background: rgba(121, 134, 203, 0.1);
    border-color: #7986cb;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(121, 134, 203, 0.2);
  }
  
  .floating-bg-elements {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
    z-index: 1;
  }
  
  .floating-circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.1;
  }
  
  .floating-circle-1 {
    top: -5rem;
    right: -5rem;
    width: 10rem;
    height: 10rem;
    background: linear-gradient(135deg, rgba(121, 134, 203, 0.3) 0%, rgba(100, 181, 246, 0.3) 100%);
    animation: heroFloat 6s ease-in-out infinite;
  }
  
  .floating-circle-2 {
    bottom: -3rem;
    left: -3rem;
    width: 8rem;
    height: 8rem;
    background: linear-gradient(135deg, rgba(79, 195, 247, 0.3) 0%, rgba(129, 199, 132, 0.3) 100%);
    animation: heroFloat 8s ease-in-out infinite reverse;
  }
  
  @keyframes heroFloat {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(180deg); }
  }
`;

// Enhanced border color function
const getBorderColor = (value, error) => {
  if (!value) return 'input-glass'; 
  if (error) return 'input-glass input-invalid'; 
  return 'input-glass input-valid'; 
};

  const validateNameRealTime = (name) => {
    // Check if name is empty
    if (!name) return '';
    
    // Check for leading or trailing spaces
    if (name !== name.trim()) {
      return 'Name cannot have spaces at the beginning or end';
    }
    
    // Check if name is only spaces (after we know it's not empty)
    if (!name.trim()) {
      return 'Name cannot be only spaces';
    }
    
    // Check minimum length
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    
    return '';
  };

  const validateEmailRealTime = (email) => {
    // Check if email is empty
    if (!email) return '';
    
    // Check for leading or trailing spaces
    if (email !== email.trim()) {
      return 'Email cannot have spaces at the beginning or end';
    }
    
    // Check for spaces anywhere in the email
    if (email.includes(' ')) {
      return 'Email cannot contain spaces';
    }
    
    // Check if email contains @student
    if (!email.includes('@student.')) {
      return 'Email must contain "@student" (e.g., yourname@student.university.edu)';
    }
    
    // Check if email matches the required format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@student\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid university email format';
    }
    
    return '';
  };

  const validateStudentIdRealTime = (studentId) => {
    // Check if studentId is empty
    if (!studentId) return '';
    
    // Check for leading or trailing spaces
    if (studentId !== studentId.trim()) {
      return 'Student ID cannot have spaces at the beginning or end';
    }
    
    // Check for spaces anywhere
    if (studentId.includes(' ')) {
      return 'Student ID cannot contain spaces';
    }
    
    // Check if only numbers
    if (!/^\d+$/.test(studentId)) {
      return 'Student ID can only contain numbers';
    }
    
    // Check exact length
    if (studentId.length !== 8) {
      return `Student ID must be exactly 8 digits (currently ${studentId.length})`;
    }
    
    return '';
  };

  const checkStudentIdUniqueness = async (studentId) => {
    try {
      const response = await fetch(API_CONFIG.getApiUrl('/check-student-id'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId: studentId.trim() })
      });

      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Error checking Student ID uniqueness:', error);
      return false; // Allow to proceed if check fails (backend will catch it)
    }
  };

  const validateFormData = (userData) => {
    // First check for leading/trailing spaces before trimming
    if (formData.name !== formData.name.trim()) {
      throw new Error('Name cannot have spaces at the beginning or end');
    }
    
    if (formData.email !== formData.email.trim()) {
      throw new Error('Email cannot have spaces at the beginning or end');
    }
    
    if (formData.studentId !== formData.studentId.trim()) {
      throw new Error('Student ID cannot have spaces at the beginning or end');
    }

    // Now create trimmed data for further validation
    const trimmedData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      studentId: formData.studentId.trim()
    };
    
    // Check for empty fields after trimming
    if (!trimmedData.name) {
      throw new Error('Name cannot be empty or contain only spaces');
    }
    
    if (!trimmedData.email) {
      throw new Error('Email cannot be empty or contain only spaces');
    }
    
    if (!trimmedData.studentId) {
      throw new Error('Student ID cannot be empty or contain only spaces');
    }
    
    // Name validation
    if (trimmedData.name.length < 2) {
      throw new Error('Please enter a valid name (at least 2 characters)');
    }
    
    // Email validation - check for any spaces (shouldn't happen due to input prevention, but double-check)
    if (formData.email.includes(' ')) {
      throw new Error('Email cannot contain spaces');
    }
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@student\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedData.email)) {
      throw new Error('University email must be in the format: yourname@student.university.edu');
    }
    
    // Student ID validation - check for any spaces (shouldn't happen due to input prevention, but double-check)
    if (formData.studentId.includes(' ')) {
      throw new Error('Student ID cannot contain spaces');
    }
    
    const studentIdRegex = /^\d{8}$/;
    if (!studentIdRegex.test(trimmedData.studentId)) {
      throw new Error('Student ID must be exactly 8 digits (numbers only)');
    }
    
    return trimmedData;
  };

  const clearFormData = () => {
    setFormData({ name: '', email: '', studentId: '' });
    setFormErrors({ name: '', email: '', studentId: '' });
    setStudentIdChecking(false);
  };

  const handleGetStarted = () => {
    localStorage.setItem('hasSeenHero', 'true');
    setShowHeroPage(false);
    setIsRegistering(true); // Go to Register
  };

  const handleLoginFromHero = () => {
    localStorage.setItem('hasSeenHero', 'true');
    setShowHeroPage(false);
    setIsRegistering(false); // Go to Login
  };

  const handleBackToLogin = () => {
    clearFormData();
    setIsRegistering(false);
  };

  const handleRegisterNewAccount = () => {
    clearFormData(); // Clear form when starting registration
    setIsRegistering(true);
  };

  const handleLogout = () => {
    clearFormData();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveView('dashboard');
    setShowHeroPage(true);
  };

  const handleMapsView = () => {
    setActiveView('maps');
    setShowMapsView(true);
    setSidebarOpen(false);
  };

  const handleBackFromMaps = () => {
    setActiveView('dashboard');
    setShowMapsView(false);
    setSelectedBuilding(null);
  };

  const handleProfileClick = () => {
    console.log('👤 Opening profile page');
    setShowProfilePage(true);
    setSidebarOpen(false);
  };

  const handleBackToDashboard = () => {
    console.log('🏠 Back to dashboard from profile');
    setShowProfilePage(false);
  };

  const handleAccountDeleted = () => {
    console.log('🗑️ Account deleted - logging out');
    // Reset la starea inițială
    setCurrentUser(null);
    setIsAuthenticated(false);
    setShowProfilePage(false);
    setShowHeroPage(true);
    
    // Curăță localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    
    // Oprește camera dacă este activă
    if (cameraActive) {
      stopCamera();
    }
  };

  const handleUserUpdated = (updatedUser) => {
    console.log('🔄 User profile updated');
    setCurrentUser(updatedUser);
    // Salvează utilizatorul actualizat în localStorage
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const handleBuildingSelect = (buildingCode, buildingData) => {
    setSelectedBuilding(buildingCode);
    // You can also filter resources by building here
    if (buildingCode) {
      console.log('🏢 Building selected:', buildingCode);
    }
  };

  const handleResourceFromMaps = (resourceType, buildingCode) => {
    // Navigate to resource booking with pre-selected building
    setSelectedResourceType(resourceType);
    setSelectedBuilding(buildingCode);
    setShowReservationModal(true);
  };

  // Filtering functions (updated to use API resources)
  const clearFilters = () => {
    setReservationFilters({
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      minCapacity: '',
      category: ''
    });
    setFilterBasedSearch(false);
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const performFaceRegistration = async () => {
    if (!videoRef.current || !modelsLoaded) {
      setDetectionMessage('Please wait for models to load...');
      return;
    }
    setIsProcessing(true);
    const positions = ['center', 'right', 'left', 'center'];
    const instructions = [
      "Position your face in the center and hold still",
      "Slowly turn your head slightly to the left",
      "Now turn your head slightly to the right", 
      "Return to center and hold still",
      "Processing your registration..."
    ];
    try {
      // Position-based registration
      for (let i = 0; i < positions.length; i++) {
        setRegistrationStep(i);
        const currentPosition = positions[i];
        setDetectionMessage(instructions[i]);
        
        const config = faceRecognitionService.getSamplingConfig();
        const positionDelay = config.baseDelay + (isMobile ? 1000 : 500);
        await faceRecognitionService.delay(positionDelay);
        // Position verification
        let correctPosition = false;
        let attempts = 0;
        const maxAttempts = isMobile ? 40 : 25;
        
        while (!correctPosition && attempts < maxAttempts) {
          const detection = await faceRecognitionService.detectFace(videoRef.current);
          
          if (detection) {
            const detectedPosition = faceRecognitionService.analyzeFacePosition(detection);
            const quality = faceRecognitionService.isDetectionQualityGood(detection);
            
            console.log(`🎯 Position check: Looking for ${currentPosition}, detected ${detectedPosition}, quality: ${quality}`);
            
            if (detectedPosition === currentPosition && quality) {
              correctPosition = true;
              setDetectionMessage(`✅ Perfect! Hold this position...`);
              await faceRecognitionService.delay(1500);
              break;
            } else if (detection.detection.score > 0.3) {
              // Give user guidance
              if (detectedPosition !== currentPosition) {
                setDetectionMessage(`Please turn ${currentPosition === 'left' ? 'more left' : currentPosition === 'right' ? 'more right' : 'back to center'}`);
              } else {
                setDetectionMessage(`Good! Hold still for better quality...`);
              }
            }
          } else {
            setDetectionMessage(`Position your face clearly in the camera`);
          }

          await faceRecognitionService.delay(isMobile ? 400 : 300);
          attempts++;
        }
        
        if (!correctPosition) {
          console.warn(`⚠️ Position timeout for ${currentPosition} after ${attempts} attempts`);
          setDetectionMessage(`⏳ Continuing... (${currentPosition} position)`);
          await faceRecognitionService.delay(1000);
        }
      }
      
      setRegistrationStep(4);
      setDetectionMessage('Finalizing registration...');
      await faceRecognitionService.delay(1000);

      let userData;
      try {
        userData = validateFormData(formData);
      } catch (validationError) {
        throw validationError;
      }

      console.log('🔄 Starting registration for:', userData.name);
      const registeredUser = await faceRecognitionService.registerFace(videoRef.current, userData);
      
      setDetectionMessage('Registration complete! 🎉');
      await faceRecognitionService.delay(2000);
      
      stopCamera();
      setIsRegistering(false);
      setRegistrationStep(0);
      alert(`Welcome ${registeredUser.name}! You have been successfully registered. You can now use the Login option.`);

      // Clear form
      setFormData({ name: '', email: '', studentId: '' });
      setFormErrors({ name: '', email: '', studentId: '' });
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      setDetectionMessage('Registration failed. Please try again.');
      
      // Show specific error message
      if (error.message.includes('Student ID is already registered')) {
        alert(`Registration failed: ${error.message}\n\nPlease check your Student ID or contact support if you believe this is an error.`);
      } else if (error.message.includes('email is already registered')) {
        alert(`Registration failed: ${error.message}\n\nPlease try logging in instead or use a different email address.`);
      } else if (error.message.includes('cannot contain spaces')) {
        alert(`Registration failed: ${error.message}\n\nPlease remove any spaces from your input fields.`);
      } else if (error.message.includes('only spaces')) {
        alert(`Registration failed: ${error.message}\n\nPlease enter valid information in all fields.`);
      } else if (error.message.includes('@student')) {
        alert(`Registration failed: ${error.message}\n\nExample: john.doe@student.university.edu`);
      } else if (error.message.includes('8 digits')) {
        alert(`Registration failed: ${error.message}\n\nExample: 12345678`);
      } else if (error.message.includes('Insufficient face samples')) {
        alert(`Registration failed: ${error.message}\n\nTips:\n• Ensure good lighting\n• Keep your face clearly visible\n• Avoid moving too much\n• Try again in better lighting conditions`);
      } else {
        alert(`Registration failed: ${error.message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Camera start with better error handling
  const startCamera = useCallback(async () => {
    try {
      if (!modelsLoaded) {
        throw new Error('Face recognition models not loaded');
      }

      console.log('📹 Starting camera...');
      setCameraActive(true);

      await faceRecognitionService.delay(100);

      if (!videoRef.current) {
        throw new Error('Video element not ready');
      }

      const stream = await faceRecognitionService.startVideo(videoRef.current);
      streamRef.current = stream;
      
      videoRef.current.onloadedmetadata = () => {
        const video = videoRef.current;
        if (video) {
          console.log('📹 Video metadata loaded:', {
            width: video.videoWidth,
            height: video.videoHeight,
            readyState: video.readyState
          });
          
          const maxWidth = isMobile ? Math.min(window.innerWidth * 0.85, 400) : 400;
          const aspectRatio = video.videoWidth / video.videoHeight;
          const containerWidth = maxWidth;
          const containerHeight = maxWidth / aspectRatio;
          
          setVideoSize({ width: containerWidth, height: containerHeight });
          
          if (canvasRef.current) {
            canvasRef.current.width = video.videoWidth;
            canvasRef.current.height = video.videoHeight;
          }
        }
      };

      setTimeout(() => {
        if (streamRef.current) {
          if (isRegistering) {
            // Start registration process when in registration mode
            console.log('📝 Starting registration process...');
            performFaceRegistration();
          } else {
            // Start detection loop for login mode
            startDetectionLoop();
          }
        }
      }, isMobile ? 1500 : 1000);
      
    } catch (error) {
      console.error('📹 Camera start error:', error);
      setCameraActive(false);
      throw error;
    }
  }, [modelsLoaded, isRegistering, isMobile, performFaceRegistration]);

  const debugCameraState = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      console.log('📹 Camera Debug Info:', {
        readyState: video.readyState,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        currentTime: video.currentTime,
        duration: video.duration,
        paused: video.paused,
        muted: video.muted,
        srcObject: !!video.srcObject,
        tracks: video.srcObject ? video.srcObject.getTracks().length : 0
      });
    } else {
      console.log('📹 No video element available');
    }
  };

  // Detection loop for real-time feedback
  const startDetectionLoop = useCallback(() => {
    if (!streamRef.current || isAuthenticated) return;
    
    let frameCount = 0;
    const detectionLoop = async () => {
      if (!videoRef.current || !streamRef.current) return;
      
      frameCount++;
      // Run detection every few frames to avoid overwhelming mobile devices
      const detectionInterval = isMobile ? 10 : 6;
      
      if (frameCount % detectionInterval === 0) {
        try {
          const detection = await faceRecognitionService.detectFace(videoRef.current);
          
          if (detection) {
            setFaceDetected(true);
            // Feedback based on detection quality
            const quality = faceRecognitionService.isDetectionQualityGood(detection);
            const score = detection.detection.score;
            
            if (quality) {
              setDetectionMessage(`✅ Face detected clearly (${(score * 100).toFixed(0)}%)`);
            } else if (score > 0.3) {
              setDetectionMessage(`⚠️ Face detected, improve positioning (${(score * 100).toFixed(0)}%)`);
            } else {
              setDetectionMessage(`🔍 Weak detection, adjust lighting (${(score * 100).toFixed(0)}%)`);
            }
            // Draw detection overlay
            if (canvasRef.current) {
              const canvas = canvasRef.current;
              const video = videoRef.current;
              const scaleX = canvas.width / video.videoWidth;
              const scaleY = canvas.height / video.videoHeight;
              
              faceRecognitionService.drawFaceDetection(canvas, detection, scaleX, scaleY);
            }
          } else {
            setFaceDetected(false);
            setDetectionMessage('Position your face in the circle');
            
            // Clear canvas
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
          }
        } catch (error) {
          console.error('Detection loop error:', error);
        }
      }
      // Continue loop
      if (streamRef.current) {
        requestAnimationFrame(detectionLoop);
      }
    };
    detectionLoop();
  }, [isMobile, isAuthenticated]);

  // Login handler with feedback
  const handleLogin = async () => {
    if (!modelsLoaded) {
      alert('Face recognition models are still loading. Please wait...');
      return;
    }
    console.log('🔑 Starting login process...');
    setDetectionMessage('Initializing camera...');
    try {
      await startCamera();
      setDetectionMessage('Camera ready. Looking for your face...');
      // Warm-up for mobile devices
      const warmupTime = isMobile ? 2000 : 1000;
      await faceRecognitionService.delay(warmupTime);
      
      let shouldContinue = true;
      let attempt = 0;
      const attemptLogin = async () => {
        if (!shouldContinue || !videoRef.current || isAuthenticated) {
          return;
        }
        attempt++;
        console.log(`🔍 Login attempt ${attempt}`);
        setDetectionMessage(`Recognizing your face... (${attempt})`);
        try {
          const result = await faceRecognitionService.authenticateUser(videoRef.current);
          console.log('🔍 Authentication result:', result);

          if (result.authenticated) {
            console.log(`✅ Login successful for ${result.user.name}`);
            setDetectionMessage(`Welcome back, ${result.user.name}! 🎉`);
            // Show success feedback
            await faceRecognitionService.delay(2000);
            stopCamera();
            setIsAuthenticated(true);
            setCurrentUser(result.user);
            shouldContinue = false;
          } else {
            console.log(`❌ Login failed: ${result.error}`);
            
            if (attempt < 6) { // Increased attempts for mobile
              setDetectionMessage(`Not recognized. Trying again... (${attempt}/6)`);
              // Progressive delay - longer delays for repeated failures
              const retryDelay = Math.min(1000 + (attempt * 500), 3000);
              await faceRecognitionService.delay(retryDelay);
              setTimeout(attemptLogin, 200);
            } else {
              setDetectionMessage('Authentication failed. Please try again or register.');
              
              // Error feedback
              const errorMessage = `Authentication failed after ${attempt} attempts.\n\n`;
              const tips = result.debug 
                ? `Debug info:\n• Detections: ${result.debug.detections || 0}\n• Best score: ${result.debug.bestScore || 'N/A'}\n• Distance: ${result.debug.bestDistance || 'N/A'}\n\nTips:\n• Ensure good lighting\n• Position your face clearly\n• Remove glasses if possible\n• Try registering again if issues persist`
                : 'Tips:\n• Ensure good lighting\n• Position your face clearly\n• Try registering if you haven\'t already';
              
              setTimeout(() => {
                if (shouldContinue) {
                  stopCamera();
                  alert(errorMessage + tips);
                }
              }, 3000);
            }
          }
        } catch (error) {
          console.error('❌ Authentication error:', error);
          setDetectionMessage('Authentication error. Please try again.');
          setTimeout(() => {
            if (shouldContinue && !isAuthenticated) {
              stopCamera();
              alert(`Authentication error: ${error.message}\n\nPlease try again.`);
            }
          }, 3000);
        }
      };
      // Start authentication with delay
      setTimeout(attemptLogin, 1000);
      
    } catch (error) {
      console.error('❌ Login initialization error:', error);
      setDetectionMessage('Camera error. Please check permissions.');
      alert(`Failed to start camera: ${error.message}\n\nPlease:\n• Allow camera access\n• Ensure no other app is using the camera\n• Try refreshing the page`);
    }
  };

  const handleReserveClick = (resourceType) => {
    setSelectedResourceType(resourceType);
    setShowReservationModal(true);
  };

  // Handler functions - reservations
  const handleCancelReservation = async (reservationId) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
  
    try {
      await reservationService.cancelReservation(reservationId, currentUser.id);
      await fetchUserReservations();
      alert('Reservation cancelled successfully');
    } catch (error) {
      alert('Failed to cancel reservation');
    }
  };

  // Resource detail functions
  const handleShowResourceDetails = (resource, category) => {
    setSelectedResource(resource);
    setSelectedResourceCategory(category);
    setShowResourceDetailModal(true);
  };

  const handleResourceReserved = () => {
    // Refresh reservations and resources when a new reservation is made
    fetchUserReservations();
    fetchResources();
    setShowResourceDetailModal(false);
  };

    const getStatusBadgeClass = (status) => {
    const baseClass = "status-badge";
    switch(status) {
      case 'completed': return `${baseClass} status-completed`;
      case 'active': return `${baseClass} status-available`;
      case 'checkin-ready': return `${baseClass} status-pending`;
      case 'overdue': return `${baseClass} status-booked`;
      case 'missed': return `${baseClass} status-booked`;
      default: return `${baseClass} status-pending`;
    }
  };

  const handleMakeReservation = () => {
    setActiveView('make-reservation');
    setSidebarOpen(false);
  };

  const handleMyReservations = () => {
    setActiveView('my-reservations');
    setSidebarOpen(false);
  };

  const handleModifyReservation = (reservationId) => {
    // For now, we'll just show an alert. You can implement a modify modal later
    alert('Modify functionality coming soon!');
  };

  const handleDashboard = () => {
    setActiveView('dashboard');
    setSidebarOpen(false);
  };

  const getNavItemClass = (isActive, category = '') => {
    const baseClass = "flex items-center gap-3 w-full px-4 py-3 text-left rounded-xl transition-all duration-300 transform hover:scale-105";
    const categoryClass = category ? `category-${category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '')}` : '';
    if (isActive) {
      return `${baseClass} ${categoryClass} bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg`;
    }
    return `${baseClass} ${categoryClass} text-gray-700 hover:bg-gray-100 hover:text-indigo-600`;
  };

  const getResourceIcon = (category) => {
    switch(category) {
      case 'Study Rooms': return <Monitor className="w-5 h-5" />;
      case 'Computer Labs': return <Laptop className="w-5 h-5" />;
      case 'Library Resources': return <BookOpen className="w-5 h-5" />;
      case 'Equipment': return <Presentation className="w-5 h-5" />;
      case 'Templates & Tools': return <FileText className="w-5 h-5" />;
      case 'Software Licenses': return <Package className="w-5 h-5" />;
      case 'Collaboration Spaces': return <Users className="w-5 h-5" />;
      case 'Learning Materials': return <GraduationCap className="w-5 h-5" />;
      case 'Special Equipment': return <Cpu className="w-5 h-5" />;
      case 'Study Aids': return <Headphones className="w-5 h-5" />;
      default: return <Monitor className="w-5 h-5" />;
    }
  };

  const getFilteredResources = (category) => {
    const resourcesData = Object.keys(apiResources).length > 0 ? apiResources : resources;
    let filtered = resourcesData[category] || [];
    // Filter by capacity (this is now handled by the API, but keeping for fallback)
    if (reservationFilters.minCapacity) {
      const minCap = parseInt(reservationFilters.minCapacity);
      filtered = filtered.filter(resource => {
        const capacity = resource.capacity || resource.maxUsers || resource.computers || 1;
        return capacity >= minCap;
      });
    }
    // Filter by availability
    filtered = filtered.filter(resource => resource.available);
    return filtered;
  };

  const getFilteredCategories = () => {
    const resourcesData = Object.keys(apiResources).length > 0 ? apiResources : resources;
    let categories = Object.keys(resourcesData);
    // Filter by selected category
    if (reservationFilters.category) {
      categories = categories.filter(cat => cat === reservationFilters.category);
    }
    // Only show categories that have available resources after filtering
    categories = categories.filter(category => getFilteredResources(category).length > 0);  
    return categories;
  };

  const handleFilterBasedSearch = () => {
    // Validation for filter-based search
    if (!reservationFilters.date || !reservationFilters.startTime || !reservationFilters.endTime) {
      alert('Please fill in Date, Start Time and End Time to search for resources.');
      return;
    }
    // Validate date and time
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    // Check if date is in the past
    if (reservationFilters.date < today) {
      alert(`Cannot search for past dates. Selected: ${reservationFilters.date}, Today: ${today}`);
      return;
    }
    // Check if time is in the past for today's reservations
    if (reservationFilters.date === today && reservationFilters.startTime <= currentTime) {
      alert(`Cannot search for past times. Selected: ${reservationFilters.startTime}, Current time: ${currentTime}`);
      return;
    }
    // Validate time order
    if (reservationFilters.startTime >= reservationFilters.endTime) {
      alert('End time must be after start time.');
      return;
    }
    // Check minimum duration (30 minutes)
    const start = new Date(`2000-01-01T${reservationFilters.startTime}`);
    const end = new Date(`2000-01-01T${reservationFilters.endTime}`);
    const diffMinutes = (end - start) / (1000 * 60);
    
    if (diffMinutes < 30) {
      alert('Reservation must be at least 30 minutes long.');
      return;
    }
    if (diffMinutes > 480) { // 8 hours
      alert('Reservation cannot be longer than 8 hours.');
      return;
    }    
    setFilterBasedSearch(true);
    setShowFilterReservationModal(true);
  };

  // Check-in functionality
  const handleCheckIn = async (reservation) => {
    const now = new Date();
    const reservationDateTime = new Date(`${reservation.date}T${reservation.start_time}`);
    const timeDiff = now.getTime() - reservationDateTime.getTime();
    const checkInWindow = 15 * 60 * 1000; // 15 minutes - Available before start time
    const lateWindow = 30 * 60 * 1000; // 30 minutes - Too late for check-in

    // Check if it's the right time to check in
    if (timeDiff < -checkInWindow) {
      alert('Check-in not available yet. You can check in 15 minutes before your reservation.');
      return;
    }

    if (timeDiff > lateWindow) {
      alert('Check-in window has expired. Please contact support.');
      return;
    }

    if (reservation.check_in_time) {
      alert('You have already checked in for this reservation.');
      return;
    }
    // Perform facial verification check-in
    try {
      const response = await fetch(API_CONFIG.getApiUrl(`/reservations/${reservation.id}/checkin`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Successfully checked in!');
        await fetchUserReservations(); // Refresh to show updated status
      } else {
        alert(result.error || 'Check-in failed');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Check-in failed. Please try again.');
    }
  };

  // Check-out functionality
  const handleCheckOut = async (reservation) => {
    if (!reservation.check_in_time) {
      alert('You must check in before checking out.');
      return;
    }

    if (reservation.check_out_time) {
      alert('You have already checked out.');
      return;
    }
    try {
      const response = await fetch(API_CONFIG.getApiUrl(`/reservations/${reservation.id}/checkout`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const result = await response.json();
      if (response.ok) {
        alert('Successfully checked out!');
        await fetchUserReservations(); // Refresh to show updated status
      } else {
        alert(result.error || 'Check-out failed');
      }
    } catch (error) {
      console.error('Check-out error:', error);
      alert('Check-out failed. Please try again.');
    }
  };

  // Enhanced device environment check
  useEffect(() => {
    // Enhanced environment debugging
    const envInfo = {
      protocol: window.location.protocol,
      isSecureContext: window.isSecureContext,
      hasGetUserMedia: !!(navigator.mediaDevices?.getUserMedia),
      hasWebRTC: !!(window.RTCPeerConnection),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      language: navigator.language,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory || 'unknown'
    };
    console.log('🌍 Environment check:', envInfo);
    // Security warnings
    if (!window.isSecureContext) {
      console.warn('⚠️ Not a secure context - camera may not work');
      alert('⚠️ Camera requires HTTPS. Please access via https:// for full functionality.');
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      console.error('❌ getUserMedia not available');
      alert('❌ Camera access not supported in this browser.');
    }
    // iOS specific checks
    if (faceRecognitionService && faceRecognitionService.deviceInfo && faceRecognitionService.deviceInfo.isIOS) {
      console.log('📱 iOS device detected - using optimized settings');
      // Check for iOS version issues
      const iOSVersion = navigator.userAgent.match(/OS (\d+)_/);
      if (iOSVersion && parseInt(iOSVersion[1]) < 14) {
        console.warn('⚠️ Older iOS version detected - face recognition may be less reliable');
      }
      // Prevent iOS zoom on input focus
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      }
    }
    // Prevent screen sleep during camera use
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').catch(console.warn);
    }
  }, []);

  // Helper function to get reservation status
  const getReservationStatus = (reservation) => {
    const now = new Date();  
    try {
      // Handle ISO datetime format from API
      let reservationDateTime, endDateTime;
      
      if (reservation.date && reservation.start_time && reservation.end_time) {
        // Extract just the date part from ISO string (YYYY-MM-DD)
        const dateOnly = reservation.date.split('T')[0]; // "2025-06-20"
        
        // Combine with times properly
        reservationDateTime = new Date(`${dateOnly}T${reservation.start_time}`);
        endDateTime = new Date(`${dateOnly}T${reservation.end_time}`);
        
        console.log('🔍 FIXED - Date only:', dateOnly);
        console.log('🔍 FIXED - Combined start:', `${dateOnly}T${reservation.start_time}`);
        console.log('🔍 FIXED - Parsed start datetime:', reservationDateTime);
        console.log('🔍 FIXED - Is valid?', !isNaN(reservationDateTime.getTime()));
        
      } else {
        // Fallback for other formats
        console.warn('Unexpected reservation format:', reservation);
        return { status: 'pending', label: 'Pending', color: 'text-gray-600' };
      }
      
      // Check if dates are valid
      if (isNaN(reservationDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        console.error('Invalid date parsing:', { reservationDateTime, endDateTime });
        return { status: 'pending', label: 'Pending', color: 'text-gray-600' };
      }
      
      // Status logic with proper date handling
      if (reservation.check_out_time) {
        return { status: 'completed', label: 'Completed', color: 'text-green-600' };
      }
      
      if (reservation.check_in_time) {
        if (now > endDateTime) {
          return { status: 'overdue', label: 'Check-out Overdue', color: 'text-orange-600' };
        }
        return { status: 'active', label: 'Checked In', color: 'text-blue-600' };
      }
      
      const timeDiff = now.getTime() - reservationDateTime.getTime();
      const checkInWindow = 15 * 60 * 1000; // 15 minutes
      const lateWindow = 30 * 60 * 1000; // 30 minutes
      
      console.log('🔍 FIXED - Time difference (ms):', timeDiff);
      console.log('🔍 FIXED - Time difference (min):', Math.round(timeDiff / (60 * 1000)));
      console.log('🔍 FIXED - Current time:', now);
      console.log('🔍 FIXED - Reservation time:', reservationDateTime);
      
      if (timeDiff >= -checkInWindow && timeDiff <= lateWindow) {
        console.log('🔍 FIXED - Status: READY TO CHECK IN');
        return { status: 'checkin-ready', label: 'Ready to Check In', color: 'text-indigo-600' };
      }
      
      if (now > endDateTime) {
        console.log('🔍 FIXED - Status: MISSED');
        return { status: 'missed', label: 'Missed', color: 'text-red-600' };
      }
      
      if (timeDiff < -checkInWindow) {
        console.log('🔍 FIXED - Status: UPCOMING');
        return { status: 'upcoming', label: 'Upcoming', color: 'text-gray-600' };
      }
      
      console.log('🔍 FIXED - Status: PENDING (fallback)');
      return { status: 'pending', label: 'Pending', color: 'text-gray-600' };
      
    } catch (error) {
      console.error('Error in getReservationStatus:', error);
      return { status: 'pending', label: 'Pending', color: 'text-gray-600' };
    }
  };

  const renderMapsView = () => (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Campus Maps & Navigation
        </h3>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            mapsApiAvailable 
              ? 'bg-green-100 text-green-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              mapsApiAvailable ? 'bg-green-400' : 'bg-yellow-400'
            }`}></div>
            {mapsApiAvailable ? 'Live Data' : 'Offline Mode'}
          </div>

          {lastCacheUpdate && (
            <div className="text-xs text-gray-500">
              Updated {Math.round((Date.now() - lastCacheUpdate) / 60000)}m ago
            </div>
          )}

          <button
            onClick={handleBackFromMaps}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-300"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Dashboard
          </button>
        </div>
      </div>

      <MapsDashboardComponent
        currentUser={currentUser}
        onResourceSelect={handleResourceFromMaps}
        initialBuilding={selectedBuilding}
      />
    </div>
  );

  if (showHeroPage) {
    return (
      <HeroLandingPage
        onGetStarted={handleGetStarted}
        onLogin={handleLoginFromHero}
      />
    );
  }

// Login/Registration Screen
if (!isAuthenticated) {
  return (
    <FaceRecognitionErrorBoundary currentUser={currentUser}>
      <div className="auth-container min-h-screen bg-gradient-to-br flex items-center justify-center p-4">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setShowHeroPage(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-lg text-gray-700 hover:text-gray-900 hover:bg-white/90 rounded-lg shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-200/50"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home Page
          </button>
        </div>

        <div className="absolute top-6 left-6 z-10">
          <div className="text-white/70 text-sm font-medium">
            {new Date().getHours() < 12 ? '🌅 Good Morning' :
             new Date().getHours() < 18 ? '☀️ Good Afternoon' : '🌙 Good Evening'}
          </div>
        </div>

        {/* Enhanced Card Container with Floating Elements */}
        <div className="relative z-10">
          {/* Floating background elements */}
          <div className="floating-bg-elements">
            <div className="floating-circle floating-circle-1"></div>
            <div className="floating-circle floating-circle-2"></div>
          </div>
          
          <div className="max-w-xl form-card-gradient animate-float rounded-2xl relative z-10" style={{ padding: '2rem' }}>
            <style>{tooltipStyles}</style>
            
            {/* Enhanced Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 relative overflow-hidden" 
                   style={{ 
                     background: 'linear-gradient(135deg, #7986cb 0%, #64b5f6 100%)',
                     boxShadow: '0 10px 15px -3px rgba(121, 134, 203, 0.3)'
                   }}>
                <Laptop className="w-8 h-8 text-white relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/20"></div>
              </div>
              <h1 className="text-3xl font-bold mb-2" style={{ 
                background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent'
              }}>
                {isRegistering ? 'Create your Account' : 'Welcome!'}
              </h1>
              <p className="text-gray-600 font-medium">
                {isRegistering
                  ? 'Set up secure facial authentication'
                  : 'Sign in with facial recognition'
                }
              </p>
            </div>

            {!cameraActive && !isRegistering ? (
              !showEmailLogin ? (
                  <div className="space-y-4">
                    <button
                      onClick={handleLogin}
                      className="w-full text-white py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 btn-primary-gradient"
                    >
                      <Camera className="w-6 h-6" />
                      Login with Face ID
                    </button>
                    
                    <button
                      onClick={() => setShowEmailLogin(true)}
                      className="w-full py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-3"
                      style={{
                        background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                        color: 'white',
                        boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.3)'
                      }}
                    >
                      <Mail className="w-6 h-6" />
                      📧 Login with Email Code
                    </button>
                    
                    <button
                      onClick={handleRegisterNewAccount}
                      className="w-full py-3 px-6 rounded-lg font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-300"
                    >
                      Register New Account
                    </button>
                  </div>
                ) : (
                  <EmailOTPLogin 
                    onLogin={(user) => {
                      setCurrentUser(user);
                      setIsAuthenticated(true);
                      setShowEmailLogin(false); // Reset for next time
                    }}
                    onBack={() => setShowEmailLogin(false)}
                  />
                )
            ) : isRegistering && !cameraActive ? (
              <div className="space-y-4">
                {/* Name Field */}
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData({...formData, name});
                        setFormErrors({...formErrors, name: validateNameRealTime(name)});
                      }}
                      className={`flex-1 px-5 py-4 rounded-xl text-gray-800 font-medium placeholder-gray-500 focus:outline-none focus:ring-0 ${
                        getBorderColor(formData.name, formErrors.name)
                      }`}
                    />
                    <div className="tooltip-container flex-shrink-0">
                      <Info className="w-6 h-6 text-gray-400 hover:text-indigo-500 cursor-help transition-all duration-300 hover:scale-110" />
                      <div className="tooltip">
                        <strong style={{ color: '#64b5f6' }}>Full Name Requirements:</strong><br/>
                        • Must be at least 2 characters long<br/>
                        • Cannot be empty or contain only spaces<br/>
                        • Letters and spaces are allowed<br/>
                        • Special characters are not recommended
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Email Field */}
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <input
                      type="email"
                      placeholder="University Email (e.g., john@student.university.edu)"
                      value={formData.email}
                      onChange={(e) => {
                        const email = e.target.value;
                        if (email.includes(' ')) return;
                        
                        setFormData({...formData, email});
                        setFormErrors({...formErrors, email: validateEmailRealTime(email)});
                      }}
                      className={`flex-1 px-5 py-4 rounded-xl text-gray-800 font-medium placeholder-gray-500 focus:outline-none focus:ring-0 ${
                        getBorderColor(formData.email, formErrors.email)
                      }`}
                    />
                    <div className="tooltip-container flex-shrink-0">
                      <Info className="w-6 h-6 text-gray-400 hover:text-indigo-500 cursor-help transition-all duration-300 hover:scale-110" />
                      <div className="tooltip">
                        <strong style={{ color: '#64b5f6' }}>University Email Requirements:</strong><br/>
                        • Must contain "@student" in the email address<br/>
                        • Format: yourname@student.university.edu<br/>
                        • No spaces allowed anywhere<br/>
                        • Must be a valid email format<br/>
                        • Example: john.doe@student.myuni.edu
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student ID Field */}
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Student ID (8 digits)"
                      value={formData.studentId}
                      onChange={(e) => {
                        const studentId = e.target.value;
                        if (studentId.includes(' ') || (studentId && !/^\d*$/.test(studentId)) || studentId.length > 8) return;
                        
                        setFormData({...formData, studentId});
                        const error = validateStudentIdRealTime(studentId);
                        setFormErrors({...formErrors, studentId: error});
                        
                        if (studentId.length === 8 && !error) {
                          checkStudentIdUniqueness(studentId);
                        }
                      }}
                      maxLength="8"
                      className={`flex-1 px-5 py-4 rounded-xl text-gray-800 font-medium placeholder-gray-500 focus:outline-none focus:ring-0 ${
                        getBorderColor(formData.studentId, formErrors.studentId)
                      }`}
                    />
                    <div className="tooltip-container flex-shrink-0">
                      <Info className="w-6 h-6 text-gray-400 hover:text-indigo-500 cursor-help transition-all duration-300 hover:scale-110" />
                      <div className="tooltip">
                        <strong style={{ color: '#64b5f6' }}>Student ID Requirements:</strong><br/>
                        • Must be exactly 8 digits<br/>
                        • Only numbers allowed (0-9)<br/>
                        • No spaces or special characters<br/>
                        • Must be unique (not already registered)<br/>
                        • Example: 12345678<br/>
                        • Each ID can only be used once
                      </div>
                    </div>
                  </div>
                  {/* Enhanced counter */}
                  <div className="flex justify-between items-center mt-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-blue-400"></div>
                      <p className="text-gray-500 text-sm font-medium">
                        {formData.studentId.length}/8 digits
                      </p>
                    </div>
                    {studentIdChecking && (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-indigo-600 text-sm font-medium">Checking availability...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Buttons */}
                <div className="space-y-4 pt-4">
                  <button
                    onClick={() => {
                      try {
                        const validatedData = validateFormData(formData);
                        
                        if (Object.values(formErrors).some(error => error)) {
                          alert('Please fix the validation errors before proceeding');
                          return;
                        }
                        
                        if (studentIdChecking) {
                          alert('Please wait while we check Student ID availability');
                          return;
                        }
                        
                        setFormData(validatedData);
                        startCamera();
                      } catch (error) {
                        alert(error.message);
                      }
                    }}
                    disabled={
                      !formData.name || !formData.email || !formData.studentId || 
                      Object.values(formErrors).some(error => error) || 
                      studentIdChecking
                    }
                    className="w-full text-white py-4 px-6 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed btn-primary-gradient"
                  >
                    {studentIdChecking ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Checking...
                      </div>
                    ) : (
                      'Continue to Face Registration'
                    )}
                  </button>
                  
                  <button
                    onClick={handleBackToLogin}
                    className="w-full py-3 px-6 rounded-xl font-semibold btn-secondary-glass"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="videoContainer relative rounded-2xl overflow-hidden border-4 border-indigo-400"
                  style={{
                    width: `${videoSize.width}px`,
                    height: `${videoSize.height}px`,
                    margin: '0 auto',
                    maxWidth: '100%',
                    maxHeight: isMobile ? '60vh' : '400px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e1f5fe 100%)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                  }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      display: 'block',
                      backgroundColor: '#000',
                      position: 'relative',
                      zIndex: 1
                    }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 pointer-events-none"
                    style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%', 
                      height: '100%',
                      zIndex: 2
                    }}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      zIndex: 3
                    }}
                  >
                    <div 
                      style={{
                        width: isMobile ? '60%' : '48%',
                        aspectRatio: '1',
                        border: `4px solid ${faceDetected ? '#10b981' : '#6366f1'}`,
                        borderRadius: '50%',
                        opacity: 0.7,
                        transition: 'border-color 0.3s ease',
                        boxShadow: faceDetected ? '0 0 20px rgba(16, 185, 129, 0.5)' : '0 0 20px rgba(99, 102, 241, 0.5)'
                      }}
                    />
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-lg font-medium text-gray-800 mb-2">
                    {isRegistering ? (
                      registrationStep < 4 ? 
                        [
                          "Position your face in the center and hold still",
                          "Slowly turn your head slightly to the left",
                          "Now turn your head slightly to the right", 
                          "Return to center and hold still"
                        ][registrationStep]
                      : "Processing your registration..."
                    ) : detectionMessage}
                  </p>
                  {!modelsLoaded && (
                    <p className="text-sm text-gray-500 mt-2 animate-pulse">Loading face recognition models...</p>
                  )}
                  {isRegistering && (
                    <div className="flex justify-center mt-2 space-x-1">
                      {[0,1,2,3,4].map((index) => (
                        <div
                          key={index}
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            index <= registrationStep ? 'bg-indigo-600 shadow-lg' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  {isMobile && (
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Tip: Hold your device steady and ensure good lighting
                    </p>
                  )}
                </div>

                <button
                  onClick={() => {
                    stopCamera();
                    clearFormData();
                  }}
                  className="w-full py-3 px-6 rounded-xl font-semibold btn-secondary-glass"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Cancel'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </FaceRecognitionErrorBoundary>
  );
}

  const updatedSidebarNavigation = () => (
    <nav className="space-y-2 mb-6">
      {/* Existing navigation items */}
      <button
        onClick={handleDashboard}
        className={getNavItemClass(activeView === 'dashboard')}
      >
        <Monitor className="w-5 h-5" />
        <span>Dashboard</span>
      </button>

      {/* NEW: Maps Navigation Item */}
      <button
        onClick={handleMapsView}
        className={getNavItemClass(activeView === 'maps')}
      >
        <MapPin className="w-5 h-5" />
        <span>Campus Maps</span>
        {mapsApiAvailable && (
          <span className="ml-2 w-2 h-2 bg-green-400 rounded-full"></span>
        )}
      </button>

      <button
        onClick={handleMakeReservation}
        className={getNavItemClass(activeView === 'make-reservation')}
      >
        <Calendar className="w-5 h-5" />
        <span>Make a Reservation</span>
      </button>

      <button
        onClick={handleMyReservations}
        className={getNavItemClass(activeView === 'my-reservations')}
      >
        <Clock className="w-5 h-5" />
        <span>My Reservations</span>
      </button>
    </nav>
  );

const renderHeader = () => (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-all duration-300"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">Resource Management System</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-300">
              <Star className="w-6 h-6 text-gray-600" />
            </button>
            
            {currentUser && (
              <div className="flex items-center gap-3">
                {/* FACE NUMELE CLICKABLE */}
                <button
                  onClick={handleProfileClick}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition-all duration-300"
                >
                  <User className="w-8 h-8 text-indigo-600 bg-indigo-100 rounded-full p-1" />
                  <span className="font-medium text-gray-700 hover:text-indigo-600">
                    {currentUser.name}
                  </span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-300"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );

    // Verifică dacă trebuie să afișezi pagina de profil
  if (showProfilePage && isAuthenticated && currentUser) {
    return (
      <UserProfilePage
        currentUser={currentUser}
        onBackToDashboard={handleBackToDashboard}
        onAccountDeleted={handleAccountDeleted}
        onUserUpdated={handleUserUpdated}
      />
    );
  }

  // Main Application
  return (
    <FaceRecognitionErrorBoundary currentUser={currentUser}>
      <div className="min-h-screen bg-gray-50">
        {/* Header - folosim functia renderHeader*/}
        {renderHeader()}

        <div className="flex">
          {/* Sidebar */}
          <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transition-all duration-300`}>
            <div className="h-full overflow-y-auto">
              <div className="p-4">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="md:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-all duration-300"
                >
                  <X className="w-6 h-6" />
                </button>
                
                {/* Navigation Menu */}
                <nav className="space-y-2 mb-6">
                  <button
                    onClick={handleDashboard}
                    className={getNavItemClass(activeView === 'dashboard')}
                  >
                    <Monitor className="w-5 h-5" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={handleMapsView}
                    className={getNavItemClass(activeView === 'maps')}
                  >
                    <MapPin className="w-5 h-5" />
                    <span>Campus Maps</span>
                    {mapsApiAvailable && (
                      <span className="ml-2 w-2 h-2 bg-green-400 rounded-full"></span>
                    )}
                  </button>

                  <button
                    onClick={handleMakeReservation}
                    className={getNavItemClass(activeView === 'make-reservation')}
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Make a Reservation</span>
                  </button>

                  <button
                    onClick={handleMyReservations}
                    className={getNavItemClass(activeView === 'my-reservations')}
                  >
                    <Clock className="w-5 h-5" />
                    <span>My Reservations</span>
                  </button>
                </nav>

                <h2 className="text-lg font-semibold text-gray-800 mb-4">Resources</h2>
                <nav className="space-y-2">
                  {(Object.keys(apiResources).length > 0 ? Object.keys(apiResources) : Object.keys(resources)).map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedResourceType(category);
                        setShowReservationModal(true);
                      }}
                      className={getNavItemClass(activeView === category, category)}
                    >
                      {getResourceIcon(category)}
                      <span>{category}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 md:ml-0">
            <div className="p-4 sm:p-6 lg:p-8">
              
              {/* Dashboard View */}
              {activeView === 'dashboard' && (
                <>
                  {/* Quick Actions - Gradient Design */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Make a Reservation Button */}
                    <button
                      onClick={handleMakeReservation}
                      className="bg-indigo-600 text-white p-6 rounded-xl hover:bg-indigo-700 transition-all duration-300 flex items-center justify-between group transform hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
                      <div className="flex items-center gap-4 relative z-10">
                        <Calendar className="w-8 h-8 drop-shadow-sm" />
                        <div className="text-left">
                          <span className="font-semibold text-lg">Make a Reservation</span>
                          <div className="text-sm text-indigo-100 mt-1">Book resources & spaces</div>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300 relative z-10" />
                    </button>

                    {/* My Reservations Button */}
                    <button
                      onClick={handleMyReservations}
                      className="bg-indigo-600 text-white p-6 rounded-xl hover:bg-indigo-700 transition-all duration-300 flex items-center justify-between group transform hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
                      <div className="flex items-center gap-4 relative z-10">
                        <Clock className="w-8 h-8 drop-shadow-sm" />
                        <div className="text-left">
                          <span className="font-semibold text-lg">My Reservations</span>
                          <div className="text-sm text-blue-100 mt-1">
                            {reservations.length > 0
                              ? `${reservations.length} active booking${reservations.length !== 1 ? 's' : ''}`
                              : 'View your bookings'
                            }
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 relative z-10">
                        {reservations.length > 0 && (
                          <span className="bg-white/25 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium border border-white/20">
                            {reservations.length}
                          </span>
                        )}
                        <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </button>

                    {/* Campus Maps Button */}
                    <button
                      onClick={handleMapsView}
                      className="bg-indigo-600 text-white p-6 rounded-xl hover:bg-indigo-700 transition-all duration-300 flex items-center justify-between group transform hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
                      <div className="flex items-center gap-4 relative z-10">
                        <MapPin className="w-8 h-8 drop-shadow-sm" />
                        <div className="text-left">
                          <span className="font-semibold text-lg">Campus Maps</span>
                          <div className="text-sm text-purple-100 mt-1">Navigate & explore campus</div>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300 relative z-10" />
                    </button>
                  </div>

                  {/* Welcome Message */}
                  <div className="card p-6 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {new Date().getHours() < 11 ? 'Good Morning' : 
                         new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}, {currentUser?.name}!
                      </h3>
                      <div className="text-sm text-gray-500">
                        {new Date().toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    <p className="text-gray-600">
                      {reservations.length > 0 
                      ? `You have ${reservations.length} upcoming reservation${reservations.length !== 1 ? 's' : ''}. Ready for more?`
                      : 'Ready to book your perfect study space?'
                      }
                    </p>
                    <p className="text-gray-600">Select an option above to get started.</p>
                  </div>

                  {/* Pro Tip */}
                  <div className="card p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Info className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 mb-1">💡 Pro Tip</h4>
                        <p className="text-sm text-gray-600">
                          You can check in to your reservation 15 minutes early using facial recognition. 
                          No need to wait for staff approval!
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Maps View */}
              {activeView === 'maps' && renderMapsView()}

              {/* Make Reservation View*/}
              {activeView === 'make-reservation' && (
                <ReservationView
                  currentUser={currentUser}
                  onReservationCreated={() => {
                    fetchUserReservations();
                    setActiveView('my-reservations');
                  }}
                  onBackToDashboard={() => setActiveView('dashboard')}
                />
              )}

              {/* My Reservations View */}
              {activeView === 'my-reservations' && (
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">My Reservations</h3>
                    <button
                      onClick={handleDashboard}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-300"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      Back to Dashboard
                    </button>
                  </div>

                  {loadingReservations ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center px-6 py-3 font-semibold leading-6 text-sm shadow-lg rounded-xl text-indigo-500 bg-white hover:bg-indigo-50 transition-all duration-300 animate-pulse">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading reservations...
                      </div>
                    </div>
                  ) : reservations.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No active reservations</p>
                      <button
                        onClick={handleMakeReservation}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-1"
                      >
                        Make Your First Reservation
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reservations.map((reservation) => {
                        const status = getReservationStatus(reservation);
                        const qrCode = reservation.qr_code || `QR-${reservation.id}-${Date.now()}`;
                        
                        return (
                          <div key={reservation.id} className="card border border-gray-200 rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02]">
                            {/* Reservation Header */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center animate-pulse">
                                    <Monitor className="w-6 h-6 text-indigo-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-800">
                                      {reservation.resource_name || reservation.name}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                      {reservation.resource_type}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Status Badge */}
                                <div className="flex items-center gap-3">
                                  <span className={getStatusBadgeClass(status.status)}>
                                    {status.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                                    {status.status === 'active' && <UserCheck className="w-4 h-4" />}
                                    {status.status === 'checkin-ready' && <Clock className="w-4 h-4" />}
                                    {status.status === 'overdue' && <AlertCircle className="w-4 h-4" />}
                                    {status.status === 'missed' && <AlertCircle className="w-4 h-4" />}
                                    {status.label}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Reservation Details */}
                            <div className="px-6 py-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                                  <p className="font-medium text-gray-800">
                                    {new Date(reservation.date).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide">Time</p>
                                  <p className="font-medium text-gray-800">
                                    {reservation.start_time} - {reservation.end_time}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide">Purpose</p>
                                  <p className="font-medium text-gray-800">
                                    {reservation.purpose || 'General Use'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide">People</p>
                                  <p className="font-medium text-gray-800">
                                    {reservation.people_count || 1} person{(reservation.people_count || 1) > 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>

                              {/* Check-in/Check-out Times */}
                              {(reservation.check_in_time || reservation.check_out_time) && (
                                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    {reservation.check_in_time && (
                                      <div>
                                        <p className="text-xs text-blue-600 uppercase tracking-wide">Checked In</p>
                                        <p className="font-medium text-blue-800">
                                          {new Date(reservation.check_in_time).toLocaleTimeString()}
                                        </p>
                                      </div>
                                    )}
                                    {reservation.check_out_time && (
                                      <div>
                                        <p className="text-xs text-blue-600 uppercase tracking-wide">Checked Out</p>
                                        <p className="font-medium text-blue-800">
                                          {new Date(reservation.check_out_time).toLocaleTimeString()}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Special Requests */}
                              {reservation.special_requests && (
                                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Special Requests</p>
                                  <p className="text-sm text-gray-700">{reservation.special_requests}</p>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                              <div className="flex flex-wrap gap-2 justify-between">
                                <div className="flex flex-wrap gap-2">
                                  {/* QR Code Button */}
                                  <button
                                    onClick={() => {
                                      setSelectedQRReservation(reservation);
                                      setShowQRCode(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 text-sm transform hover:-translate-y-1"
                                  >
                                    <QrCode className="w-4 h-4" />
                                    QR Code
                                  </button>

                                  {/* Check-in Button */}
                                  {status.status === 'checkin-ready' && !reservation.check_in_time && (
                                    <button
                                      onClick={() => handleCheckIn(reservation)}
                                      className="flex items-center gap-2 px-4 py-3 btn-success rounded-lg hover:shadow-lg transition-all duration-300 text-sm transform hover:-translate-y-1"
                                    >
                                      <UserCheck className="w-4 h-4" />
                                      Check In
                                    </button>
                                  )}

                                  {/* Check-out Button */}
                                  {status.status === 'active' && reservation.check_in_time && !reservation.check_out_time && (
                                    <button
                                      onClick={() => handleCheckOut(reservation)}
                                      className="flex items-center gap-2 px-4 py-3 btn-warning rounded-lg hover:shadow-lg transition-all duration-300 text-sm transform hover:-translate-y-1"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Check Out
                                    </button>
                                  )}

                                  {/* Add Resources Button */}
                                  {!reservation.check_out_time && (
                                    <button 
                                      onClick={() => {
                                        setSelectedReservation(reservation);
                                        setShowAddResourcesModal(true);
                                      }}
                                      className="flex items-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300 text-sm transform hover:-translate-y-1"
                                      title="Add Resources"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add Resources
                                    </button>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  {/* Modify Button */}
                                  {!reservation.check_in_time && (
                                    <button 
                                      onClick={() => handleModifyReservation(reservation.id)}
                                      className="p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300 transform hover:-translate-y-1"
                                      title="Modify Reservation"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  )}

                                  {/* Cancel Button */}
                                  {!reservation.check_in_time && (
                                    <button
                                      onClick={() => handleCancelReservation(reservation.id)}
                                      className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 transform hover:-translate-y-1"
                                      title="Cancel Reservation"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Resource List for specific categories */}
              {activeView !== 'dashboard' && activeView !== 'my-reservations' && activeView !== 'make-reservation' && activeView !== 'maps' && (
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{activeView}</h3>
                    <button
                      onClick={handleDashboard}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-300"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      Back to Dashboard
                    </button>
                  </div>
                  <div className="grid gap-4">
                    {((Object.keys(apiResources).length > 0 ? apiResources : resources)[activeView] || []).map((resource) => (
                      <div key={resource.id} className="resource-card p-4 border-2 border-transparent rounded-lg hover:border-indigo-300 transition-all duration-300">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 mb-2">{resource.name}</h4>
                            
                            <div className="space-y-1 text-sm text-gray-500 mb-3">
                              {resource.location && (
                                <p className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {resource.location}
                                </p>
                              )}
                              {resource.capacity && (
                                <p className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  Capacity: {resource.capacity} people
                                </p>
                              )}
                              {resource.computers && (
                                <p className="flex items-center gap-1">
                                  <Monitor className="w-4 h-4" />
                                  {resource.computers} computers
                                </p>
                              )}
                              {resource.quantity && (
                                <p className="flex items-center gap-1">
                                  <Package className="w-4 h-4" />
                                  Available: {resource.quantity}
                                </p>
                              )}
                              {resource.licenses && (
                                <p className="flex items-center gap-1">
                                  <Package className="w-4 h-4" />
                                  Licenses available: {resource.licenses}
                                </p>
                              )}
                              {resource.maxUsers && (
                                <p className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  Max users: {resource.maxUsers}
                                </p>
                              )}
                              {resource.type && (
                                <p className="flex items-center gap-1">
                                  <FileText className="w-4 h-4" />
                                  Type: {resource.type}
                                </p>
                              )}
                            </div>

                            {resource.amenities && Array.isArray(resource.amenities) && resource.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {resource.amenities.slice(0, 3).map((amenity, index) => (
                                  <span key={index} className="status-badge px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    {amenity}
                                  </span>
                                ))}
                                {resource.amenities.length > 3 && (
                                  <span className="status-badge px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    +{resource.amenities.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}

                            {resource.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {resource.description}
                              </p>
                            )}

                            {resource.bookedReason && (
                              <p className="text-sm text-red-500 flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {resource.bookedReason}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              onClick={() => handleShowResourceDetails(resource, activeView)}
                              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 text-sm transform hover:-translate-y-1"
                            >
                              <Info className="w-4 h-4" />
                              View Details
                            </button>
                            
                            <button
                              onClick={() => {
                                setSelectedResourceType(activeView);
                                setShowReservationModal(true);
                              }}
                              className={`px-3 py-2 rounded-lg text-sm transition-all duration-300 transform hover:-translate-y-1 ${
                                resource.available
                                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                              disabled={!resource.available}
                            >
                              {resource.available ? 'Quick Reserve' : 'Unavailable'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        
        {/* Add the Modals */}
        <ReservationModal
          isOpen={showReservationModal}
          onClose={() => setShowReservationModal(false)}
          resourceType={selectedResourceType}
          currentUser={currentUser}
          allResources={resources}
          onReservationCreated={() => {
            fetchUserReservations();
            setShowReservationModal(false);
          }}
        />
        
        <AddResourcesModal
          isOpen={showAddResourcesModal}
          onClose={() => setShowAddResourcesModal(false)}
          reservation={selectedReservation}
          allResources={resources}
          onResourcesAdded={(resources) => {
            console.log('Resources added:', resources);
            setShowAddResourcesModal(false);
          }}
        />

        <ResourceDetailModal
          isOpen={showResourceDetailModal}
          onClose={() => setShowResourceDetailModal(false)}
          resource={selectedResource}
          category={selectedResourceCategory}
          onReserve={handleResourceReserved}
          currentUser={currentUser}
        />

        <QRCodeDisplay
          isOpen={showQRCode}
          onClose={() => setShowQRCode(false)}
          qrData={selectedQRReservation?.qr_code || `QR-${selectedQRReservation?.id}-${Date.now()}`}
          reservation={selectedQRReservation}
        />

        <FilterReservationModal
          isOpen={showFilterReservationModal}
          onClose={() => {
            setShowFilterReservationModal(false);
            setFilterBasedSearch(false);
          }}
          filters={reservationFilters}
          currentUser={currentUser}
          allResources={Object.keys(apiResources).length > 0 ? apiResources : resources}
          onReservationCreated={(reservation) => {
            fetchUserReservations();
            setShowFilterReservationModal(false);
            setFilterBasedSearch(false);
            alert('Reservation created successfully!');
          }}
        />
      </div>
    </div>
    </FaceRecognitionErrorBoundary>
  );
};
export default FacialAuthEducationSystem;