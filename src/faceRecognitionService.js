import * as faceapi from 'face-api.js';
import { API_CONFIG } from './config.js';

class FaceRecognitionService {
  constructor() {
    this.models = null;
    this.isLoaded = false;
    this.isModelsLoaded = false;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    this.isAndroid = /Android/i.test(navigator.userAgent);
    
    // Device detection
    this.deviceInfo = {
      isMobile: this.isMobile,
      isIOS: this.isIOS,
      isSafari: this.isSafari,
      isAndroid: this.isAndroid,
      isDesktop: !this.isMobile,
      pixelRatio: window.devicePixelRatio || 1,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
    
    console.log('🔧 Enhanced FaceRecognitionService initialized:', this.deviceInfo);
  }

  // Enhanced model loading with better error handling and CDN fallbacks
  async loadModels() {
    try {
      console.log('📥 Loading face recognition models...');
      
      // Multiple CDN options for better reliability
      const modelUrls = [
        'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights',
        'https://unpkg.com/face-api.js@latest/weights',
        '/models' // Local fallback
      ];
      
      let modelsLoaded = false;
      
      for (const modelUrl of modelUrls) {
        try {
          console.log(`🔄 Trying model URL: ${modelUrl}`);
          
          // Load models with timeout
          await Promise.race([
            this.loadModelsFromUrl(modelUrl),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Model loading timeout')), 30000)
            )
          ]);
          
          modelsLoaded = true;
          console.log(`✅ Models loaded successfully from: ${modelUrl}`);
          break;
        } catch (error) {
          console.warn(`⚠️ Failed to load from ${modelUrl}:`, error.message);
          continue;
        }
      }
      
      if (!modelsLoaded) {
        throw new Error('Failed to load models from all sources');
      }
      
      this.isLoaded = true;
      this.isModelsLoaded = true;
      
      // Warm up the models with a small test
      await this.warmUpModels();
      
      return true;
    } catch (error) {
      console.error('❌ Error loading face recognition models:', error);
      this.isLoaded = false;
      this.isModelsLoaded = false;
      return false;
    }
  }

  // Helper method to load models from a specific URL
  async loadModelsFromUrl(modelUrl) {
    // Load models sequentially for better mobile compatibility
    await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
    await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
    await faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl);
    await faceapi.nets.faceExpressionNet.loadFromUri(modelUrl);
  }

  // Warm up models to improve first detection speed
  async warmUpModels() {
    try {
      console.log('🔥 Warming up models...');
      
      // Create a small test canvas
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      
      // Draw a simple face-like pattern
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, 160, 120);
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(80, 60, 30, 0, 2 * Math.PI);
      ctx.fill();
      
      // Try detection on test image
      await faceapi.detectSingleFace(canvas, this.getDetectionOptions());
      console.log('✅ Models warmed up successfully');
    } catch (error) {
      console.warn('⚠️ Model warm-up failed (this is okay):', error.message);
    }
  }

  // Camera start with better mobile support
  async startVideo(videoElement) {
    try {
      console.log('📹 Starting video with device optimization...');
      console.log('📱 Device details:', this.deviceInfo);
      
      // Enhanced camera constraints based on device capabilities
      const constraints = this.getCameraConstraints();
      console.log('🎥 Using camera constraints:', constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = stream;

      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Video loading timeout'));
        }, 15000);

        videoElement.onloadedmetadata = () => {
          clearTimeout(timeoutId);
          
          videoElement.play().then(() => {
            console.log('✅ Video started successfully:', {
              width: videoElement.videoWidth,
              height: videoElement.videoHeight,
              readyState: videoElement.readyState,
              currentTime: videoElement.currentTime
            });
            
            // Additional wait for video to stabilize
            setTimeout(() => resolve(stream), this.isIOS ? 1000 : 500);
          }).catch(reject);
        };
        
        videoElement.onerror = (error) => {
          clearTimeout(timeoutId);
          console.error('❌ Video error:', error);
          reject(error);
        };
      });
    } catch (error) {
      console.error('❌ Error starting video:', error);
      throw this.infoError(error);
    }
  }

  // Device-specific camera constraints
  getCameraConstraints() {
    const baseConstraints = {
      video: {
        facingMode: 'user',
        aspectRatio: { ideal: 4/3 }
      },
      audio: false
    };

    if (this.isIOS) {
      // iOS-specific optimizations
      return {
        ...baseConstraints,
        video: {
          ...baseConstraints.video,
          width: { ideal: 480, max: 640 },
          height: { ideal: 360, max: 480 },
          frameRate: { ideal: 24, max: 30 },
          // iOS Safari specific settings
          resizeMode: 'crop-and-scale',
          advanced: [
            { width: { min: 320, ideal: 480, max: 640 } },
            { height: { min: 240, ideal: 360, max: 480 } },
            { frameRate: { min: 15, ideal: 24, max: 30 } }
          ]
        }
      };
    } else if (this.isAndroid) {
      // Android-specific optimizations
      return {
        ...baseConstraints,
        video: {
          ...baseConstraints.video,
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 960 },
          frameRate: { ideal: 30, max: 30 }
        }
      };
    } else {
      // Desktop optimizations
      return {
        ...baseConstraints,
        video: {
          ...baseConstraints.video,
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        }
      };
    }
  }

  // Device-specific detection options
  getDetectionOptions() {
    if (this.isIOS) {
      // Very lenient settings for iOS
      return new faceapi.TinyFaceDetectorOptions({ 
        inputSize: 224,        // Smaller for better iOS performance
        scoreThreshold: 0.25   // Very lenient threshold for iOS
      });
    } else if (this.isAndroid) {
      // Android mobile settings
      return new faceapi.TinyFaceDetectorOptions({ 
        inputSize: 288,
        scoreThreshold: 0.35
      });
    } else {
      // Desktop settings
      return new faceapi.TinyFaceDetectorOptions({ 
        inputSize: 416, 
        scoreThreshold: 0.5 
      });
    }
  }

  // Enhanced face detection with better error handling
  async detectFace(videoElement) {
    if (!this.isLoaded || !videoElement) {
      console.log('⚠️ Models not loaded or no video element');
      return null;
    }

    // Enhanced video readiness check
    if (!this.isVideoReady(videoElement)) {
      console.log('⚠️ Video not ready for detection');
      return null;
    }

    try {
      const options = this.getDetectionOptions();
      
      // Add timeout to detection
      const detection = await Promise.race([
        faceapi
          .detectSingleFace(videoElement, options)
          .withFaceLandmarks()
          .withFaceDescriptor(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Detection timeout')), 5000)
        )
      ]);

      if (detection) {
        const score = detection.detection.score;
        console.log(`✅ Face detected - Score: ${score.toFixed(3)}, Size: ${detection.detection.box.width.toFixed(0)}x${detection.detection.box.height.toFixed(0)}`);
        
        // Additional quality checks
        if (this.isDetectionQualityGood(detection)) {
          return detection;
        } else {
          console.log('⚠️ Detection quality too low, rejecting');
          return null;
        }
      }

      return null;
    } catch (error) {
      if (error.message !== 'Detection timeout') {
        console.error('❌ Face detection error:', error);
      }
      return null;
    }
  }

  // Enhanced video readiness check
  isVideoReady(videoElement) {
    return (
      videoElement &&
      videoElement.readyState >= 2 && // HAVE_CURRENT_DATA or higher
      videoElement.videoWidth > 0 &&
      videoElement.videoHeight > 0 &&
      !videoElement.paused &&
      !videoElement.ended &&
      videoElement.currentTime > 0
    );
  }

  // Check detection quality
  isDetectionQualityGood(detection) {
    const box = detection.detection.box;
    const score = detection.detection.score;
    
    // Minimum face size (adjust for mobile)
    const minSize = this.isMobile ? 80 : 100;
    const isLargeEnough = box.width >= minSize && box.height >= minSize;
    
    // Check if face is reasonably centered
    const isCentered = box.x > 0 && box.y > 0;
    
    // Device-specific score thresholds
    const minScore = this.isIOS ? 0.25 : (this.isAndroid ? 0.35 : 0.4);
    const hasGoodScore = score >= minScore;
    
    return isLargeEnough && isCentered && hasGoodScore;
  }

  // Enhanced registration with better sampling
  async registerFace(videoElement, userData) {
    if (!this.isLoaded) {
      throw new Error('Face recognition models not loaded');
    }

    try {
      console.log('🔄 Starting face registration for:', userData.name);
      console.log('📱 Device optimization level:', this.getDeviceOptimizationLevel());
      
      const samplingConfig = this.getSamplingConfig();
      console.log('📸 Sampling configuration:', samplingConfig);
      
      const descriptors = [];
      let consecutiveFailures = 0;
      const maxConsecutiveFailures = 3;
      
      for (let i = 0; i < samplingConfig.samples; i++) {
        console.log(`📸 Capturing sample ${i + 1}/${samplingConfig.samples}...`);
        
        // Dynamic delay based on device and previous success
        const delay = this.calculateDynamicDelay(i, consecutiveFailures);
        await this.delay(delay);
        
        const detection = await this.detectFace(videoElement);
        
        if (detection && detection.descriptor) {
          descriptors.push(Array.from(detection.descriptor));
          consecutiveFailures = 0;
          console.log(`✅ Sample ${i + 1} captured - Score: ${detection.detection.score.toFixed(3)}`);
        } else {
          consecutiveFailures++;
          console.warn(`⚠️ Failed to capture sample ${i + 1} (consecutive failures: ${consecutiveFailures})`);
          
          if (consecutiveFailures >= maxConsecutiveFailures) {
            // Extend sampling time for difficult conditions
            await this.delay(2000);
            consecutiveFailures = 0;
          }
          
          // Retry this sample
          i--;
          
          // Prevent infinite loop
          if (i < -10) {
            console.error('❌ Too many failed attempts');
            break;
          }
        }
      }
      
      if (descriptors.length < samplingConfig.minSamples) {
        throw new Error(`Insufficient face samples captured (${descriptors.length}/${samplingConfig.minSamples}). Please ensure good lighting and position your face clearly in the camera.`);
      }
      
      console.log(`✅ Captured ${descriptors.length} valid samples for registration`);
      
      // Descriptor averaging
      const avgDescriptor = this.AverageDescriptors(descriptors);
      
      const registrationData = {
        name: userData.name,
        email: userData.email,
        studentId: userData.studentId,
        descriptor: avgDescriptor,
        deviceInfo: this.deviceInfo,
        sampleCount: descriptors.length
      };
      
      console.log('💾 Saving user to backend...');
      
      const response = await fetch(API_CONFIG.getApiUrl('/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Registration failed on server');
      }
      
      console.log('✅ User registered successfully:', result.user);
      return result.user;
      
    } catch (error) {
      console.error('❌ Enhanced registration error:', error);
      throw error;
    }
  }

  // Get device-specific sampling configuration
  getSamplingConfig() {
    if (this.isIOS) {
      return {
        samples: 10,      // More samples for iOS
        minSamples: 4,    // Minimum required
        baseDelay: 1200   // Longer delays for iOS
      };
    } else if (this.isAndroid) {
      return {
        samples: 8,
        minSamples: 3,
        baseDelay: 800
      };
    } else {
      return {
        samples: 6,
        minSamples: 3,
        baseDelay: 600
      };
    }
  }

  // Calculate dynamic delay based on conditions
  calculateDynamicDelay(sampleIndex, consecutiveFailures) {
    const config = this.getSamplingConfig();
    let delay = config.baseDelay;
    
    // Add extra delay for consecutive failures
    delay += consecutiveFailures * 500;
    
    // Add extra delay for first few samples to let camera stabilize
    if (sampleIndex < 2) {
      delay += 1000;
    }
    
    // iOS needs even more time
    if (this.isIOS) {
      delay += 300;
    }
    
    return delay;
  }

  // Descriptor averaging with outlier removal
  AverageDescriptors(descriptors) {
    if (descriptors.length === 1) {
      return descriptors[0];
    }
    
    // Remove outliers if we have enough samples
    let filteredDescriptors = descriptors;
    if (descriptors.length >= 5) {
      filteredDescriptors = this.removeOutlierDescriptors(descriptors);
    }
    
    // Calculate weighted average (give more weight to recent samples)
    const weights = filteredDescriptors.map((_, index) => {
      return 1 + (index / filteredDescriptors.length) * 0.5; // 50% weight boost for later samples
    });
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const avgDescriptor = new Array(filteredDescriptors[0].length).fill(0);
    
    for (let i = 0; i < filteredDescriptors.length; i++) {
      const weight = weights[i] / totalWeight;
      for (let j = 0; j < filteredDescriptors[i].length; j++) {
        avgDescriptor[j] += filteredDescriptors[i][j] * weight;
      }
    }
    
    return avgDescriptor;
  }

  // Remove outlier descriptors to improve quality
  removeOutlierDescriptors(descriptors) {
    if (descriptors.length <= 3) return descriptors;
    
    // Calculate pairwise distances
    const distances = [];
    for (let i = 0; i < descriptors.length; i++) {
      let totalDistance = 0;
      for (let j = 0; j < descriptors.length; j++) {
        if (i !== j) {
          totalDistance += this.euclideanDistance(descriptors[i], descriptors[j]);
        }
      }
      distances.push({ index: i, avgDistance: totalDistance / (descriptors.length - 1) });
    }
    
    // Sort by average distance and remove the most distant ones
    distances.sort((a, b) => a.avgDistance - b.avgDistance);
    const keepCount = Math.ceil(descriptors.length * 0.8); // Keep 80% of samples
    
    const indicesToKeep = distances.slice(0, keepCount).map(d => d.index);
    return indicesToKeep.map(index => descriptors[index]);
  }

  // Authentication with multiple attempts and adaptive thresholds
  async authenticateUser(videoElement) {
    if (!this.isLoaded) {
      throw new Error('Face recognition models not loaded');
    }

    try {
      console.log('🔍 Starting authentication...');
      console.log('📱 Device info:', this.deviceInfo);
      
      const authConfig = this.getAuthenticationConfig();
      console.log('🎯 Authentication config:', authConfig);
      
      const detections = [];
      let bestDetection = null;
      let bestScore = 0;
      
      for (let i = 0; i < authConfig.samples; i++) {
        console.log(`📸 Authentication sample ${i + 1}/${authConfig.samples}...`);
        
        const detection = await this.detectFace(videoElement);
        
        if (detection && detection.descriptor) {
          detections.push(detection);
          
          if (detection.detection.score > bestScore) {
            bestDetection = detection;
            bestScore = detection.detection.score;
          }
          
          console.log(`✅ Sample ${i + 1} captured - Score: ${detection.detection.score.toFixed(3)}`);
        } else {
          console.log(`❌ Sample ${i + 1} failed`);
        }
        
        if (i < authConfig.samples - 1) {
          await this.delay(authConfig.sampleDelay);
        }
      }
      
      if (detections.length === 0) {
        return { 
          authenticated: false, 
          error: 'No face detected. Please ensure good lighting and position your face clearly in the camera.',
          debug: { samples: authConfig.samples, detections: 0 }
        };
      }
      
      console.log(`✅ Captured ${detections.length}/${authConfig.samples} valid samples`);
      
      // Use multiple strategies for comparison
      const strategies = this.getComparisonStrategies(detections, bestDetection);
      
      // Load registered users
      console.log('📡 Loading registered users...');
      const response = await fetch(API_CONFIG.getApiUrl('/users/descriptors'));
      const users = await response.json();
      
      if (!Array.isArray(users) || users.length === 0) {
        return { 
          authenticated: false, 
          error: 'No registered users found. Please register first.',
          debug: { users: 0 }
        };
      }
      
      console.log(`🔍 Comparing against ${users.length} registered users...`);
      
      // Try each strategy and find the best match
      let bestMatchResult = null;
      
      for (const strategy of strategies) {
        console.log(`🧪 Trying strategy: ${strategy.name}`);
        const result = await this.compareWithUsers(strategy.descriptor, users, strategy.threshold);
        
        if (result.authenticated && (!bestMatchResult || result.confidence > bestMatchResult.confidence)) {
          bestMatchResult = { ...result, strategy: strategy.name };
        }
      }
      
      if (bestMatchResult) {
        console.log(`✅ Authentication successful using ${bestMatchResult.strategy}`);
        
        // Update last login
        try {
          await fetch(API_CONFIG.getApiUrl(`/users/${bestMatchResult.user.id}/login`), {
            method: 'POST'
          });
        } catch (loginError) {
          console.warn('⚠️ Failed to update login time:', loginError);
        }
        
        return bestMatchResult;
      } else {
        const bestDistance = strategies.reduce((min, strategy) => {
          // Get minimum distance for debugging
          return Math.min(min, this.getMinimumDistanceToUsers(strategy.descriptor, users));
        }, Infinity);
        
        console.log(`❌ No match found. Best distance: ${bestDistance.toFixed(3)}`);
        return { 
          authenticated: false, 
          error: `Face not recognized. Please try again or ensure you're registered.`,
          debug: {
            detections: detections.length,
            bestScore: bestScore.toFixed(3),
            bestDistance: bestDistance.toFixed(3),
            strategies: strategies.length
          }
        };
      }
    } catch (error) {
      console.error('❌ Enhanced authentication error:', error);
      return { 
        authenticated: false, 
        error: error.message || 'Authentication failed'
      };
    }
  }

  // Get device-specific authentication configuration
  getAuthenticationConfig() {
    if (this.isIOS) {
      return {
        samples: 6,
        sampleDelay: 800,
        primaryThreshold: 0.35,
        fallbackThreshold: 0.45
      };
    } else if (this.isAndroid) {
      return {
        samples: 5,
        sampleDelay: 600,
        primaryThreshold: 0.4,
        fallbackThreshold: 0.5
      };
    } else {
      return {
        samples: 4,
        sampleDelay: 400,
        primaryThreshold: 0.45,
        fallbackThreshold: 0.55
      };
    }
  }

  // Get multiple comparison strategies for better accuracy
  getComparisonStrategies(detections, bestDetection) {
    const config = this.getAuthenticationConfig();
    const strategies = [];
    
    // Strategy 1: Best single detection
    strategies.push({
      name: 'best_single',
      descriptor: Array.from(bestDetection.descriptor),
      threshold: config.primaryThreshold
    });
    
    // Strategy 2: Average of all detections
    if (detections.length > 1) {
      const avgDescriptor = this.AverageDescriptors(
        detections.map(d => Array.from(d.descriptor))
      );
      strategies.push({
        name: 'average_all',
        descriptor: avgDescriptor,
        threshold: config.primaryThreshold - 0.05 // Slightly more lenient
      });
    }
    
    // Strategy 3: Average of top 3 detections by score
    if (detections.length >= 3) {
      const topDetections = detections
        .sort((a, b) => b.detection.score - a.detection.score)
        .slice(0, 3);
      const topAvgDescriptor = this.AverageDescriptors(
        topDetections.map(d => Array.from(d.descriptor))
      );
      strategies.push({
        name: 'top_3_average',
        descriptor: topAvgDescriptor,
        threshold: config.primaryThreshold
      });
    }
    
    // Strategy 4: Fallback with more lenient threshold
    strategies.push({
      name: 'lenient_fallback',
      descriptor: Array.from(bestDetection.descriptor),
      threshold: config.fallbackThreshold
    });
    
    return strategies;
  }

  // Compare descriptor with users using specific threshold
  async compareWithUsers(currentDescriptor, users, threshold) {
    let bestMatch = null;
    let bestDistance = Infinity;
    const distances = [];
    
    for (const user of users) {
      if (!user.face_descriptor || !Array.isArray(user.face_descriptor)) {
        console.warn('⚠️ Invalid descriptor for user:', user.name);
        continue;
      }
      
      const distance = this.euclideanDistance(currentDescriptor, user.face_descriptor);
      distances.push({ name: user.name, distance });
      
      if (distance < threshold && distance < bestDistance) {
        bestDistance = distance;
        bestMatch = user;
      }
    }
    
    // Log distances for debugging
    distances.sort((a, b) => a.distance - b.distance);
    console.log('📊 Distance ranking:', distances.slice(0, 3));
    
    if (bestMatch) {
      return { 
        authenticated: true, 
        user: bestMatch,
        confidence: Math.max(0, 1 - bestDistance),
        distance: bestDistance,
        threshold: threshold
      };
    } else {
      return {
        authenticated: false,
        bestDistance: bestDistance,
        threshold: threshold
      };
    }
  }

  // Get minimum distance to any user (for debugging)
  getMinimumDistanceToUsers(descriptor, users) {
    let minDistance = Infinity;
    for (const user of users) {
      if (user.face_descriptor && Array.isArray(user.face_descriptor)) {
        const distance = this.euclideanDistance(descriptor, user.face_descriptor);
        minDistance = Math.min(minDistance, distance);
      }
    }
    return minDistance;
  }

  // Enhanced error messages
  infoError(error) {
    const deviceContext = `Device: ${this.deviceInfo.isMobile ? 'Mobile' : 'Desktop'} (${this.deviceInfo.isIOS ? 'iOS' : this.deviceInfo.isAndroid ? 'Android' : 'Other'})`;
    
    if (error.name === 'NotAllowedError') {
      return new Error(`Camera access denied. ${deviceContext}. Please allow camera access and try again.`);
    } else if (error.name === 'NotFoundError') {
      return new Error(`No camera found. ${deviceContext}. Please ensure your device has a camera.`);
    } else if (error.name === 'NotReadableError') {
      return new Error(`Camera in use. ${deviceContext}. Please close other apps using the camera.`);
    } else if (error.name === 'OverconstrainedError') {
      return new Error(`Camera constraints not supported. ${deviceContext}. Trying fallback settings...`);
    } else {
      return new Error(`Camera error: ${error.message}. ${deviceContext}`);
    }
  }

  // Get device optimization level for debugging
  getDeviceOptimizationLevel() {
    if (this.isIOS) return 'iOS_Optimized';
    if (this.isAndroid) return 'Android_Optimized';
    return 'Desktop_Standard';
  }

  // Enhanced face position analysis
  analyzeFacePosition(detection) {
    if (!detection || !detection.landmarks) {
      return 'center';
    }

    try {
      const landmarks = detection.landmarks.positions;
      const faceBox = detection.detection.box;
      
      // Get nose tip (landmark index 30) and eye centers
      const noseTip = landmarks[30];
      const leftEye = landmarks[36]; // Left eye corner
      const rightEye = landmarks[45]; // Right eye corner
      
      // Calculate face center
      const faceCenter = {
        x: faceBox.x + faceBox.width / 2,
        y: faceBox.y + faceBox.height / 2
      };
      
      // Calculate relative position with device-specific sensitivity
      const relativeX = (noseTip.x - faceCenter.x) / faceBox.width;
      const threshold = this.isMobile ? 0.06 : 0.08; // More sensitive for mobile
      
      // Also consider eye alignment for better position detection
      const eyeAlignment = Math.abs(leftEye.y - rightEye.y) / faceBox.height;
      const isWellAligned = eyeAlignment < 0.1; // Eyes should be roughly aligned
      
      if (!isWellAligned) {
        console.log('⚠️ Face not well aligned, position may be inaccurate');
      }
      
      if (relativeX > threshold) return 'right';
      if (relativeX < -threshold) return 'left';
      return 'center';
    } catch (error) {
      console.error('Error analyzing face position:', error);
      return 'center';
    }
  }

  // Enhanced drawing with better mobile scaling
  drawFaceDetection(canvas, detection, scaleX = 1, scaleY = 1) {
    if (!canvas || !detection) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const box = detection.detection.box;
    const scaledBox = {
      x: box.x * scaleX,
      y: box.y * scaleY,
      width: box.width * scaleX,
      height: box.height * scaleY
    };
    
    // Device-specific styling
    const lineWidth = this.isMobile ? 3 : 2;
    const fontSize = this.isMobile ? 16 : 14;
    
    // Draw face rectangle with quality-based color
    const score = detection.detection.score;
    const quality = this.isDetectionQualityGood(detection);
    ctx.strokeStyle = quality ? '#10b981' : (score > 0.3 ? '#f59e0b' : '#ef4444');
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(scaledBox.x, scaledBox.y, scaledBox.width, scaledBox.height);
    
    // Draw confidence score
    ctx.fillStyle = ctx.strokeStyle;
    ctx.font = `${fontSize}px Arial`;
    ctx.fillText(
      `${(score * 100).toFixed(1)}%`,
      scaledBox.x,
      scaledBox.y - 5
    );
    
    // Draw quality indicator
    if (quality) {
      ctx.fillText('✓', scaledBox.x + scaledBox.width - 20, scaledBox.y - 5);
    }
    
    // Draw landmarks with adaptive size
    if (detection.landmarks) {
      ctx.fillStyle = '#3b82f6';
      const pointSize = this.isMobile ? 2.5 : 2;
      
      detection.landmarks.positions.forEach(point => {
        const scaledX = point.x * scaleX;
        const scaledY = point.y * scaleY;
        
        ctx.beginPath();
        ctx.arc(scaledX, scaledY, pointSize, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }

  // Utility methods
  euclideanDistance(desc1, desc2) {
    if (!desc1 || !desc2 || desc1.length !== desc2.length) {
      console.warn('⚠️ Invalid descriptors for distance calculation');
      return 1;
    }
    
    let sum = 0;
    for (let i = 0; i < desc1.length; i++) {
      const diff = desc1[i] - desc2[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  areModelsLoaded() {
    return this.isLoaded && this.isModelsLoaded;
  }

  // Enhanced device info for debugging
  getDeviceInfo() {
    return {
      ...this.deviceInfo,
      camera: {
        constraints: this.getCameraConstraints(),
        detectionOptions: this.getDetectionOptions(),
        samplingConfig: this.getSamplingConfig(),
        authConfig: this.getAuthenticationConfig()
      },
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory || 'unknown'
      }
    };
  }

  // Legacy compatibility methods
  async getFaceDescriptor(videoElement) {
    return this.detectFace(videoElement);
  }

  calculateDistance(point1, point2) {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + 
      Math.pow(point2.y - point1.y, 2)
    );
  }

  async saveUserToBackend(userData) {
    try {
      const response = await fetch(API_CONFIG.getApiUrl('/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save user');
      }

      return await response.json();
    } catch (error) {
      console.error('Backend save error:', error);
      throw error;
    }
  }

  async loadRegisteredFacesFromBackend() {
    try {
      const response = await fetch(API_CONFIG.getApiUrl('/users/descriptors'));
      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to load users from backend:', error);
      return [];
    }
  }

  async logAccessToBackend(userId, action, resourceInfo = {}) {
    try {
      await fetch(API_CONFIG.getApiUrl('/access-log'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action,
          ...resourceInfo,
          success: true,
          deviceInfo: this.deviceInfo
        })
      });
    } catch (error) {
      console.error('Failed to log access:', error);
    }
  }

  // Fallback localStorage methods
  loadRegisteredFaces() {
    try {
      const stored = localStorage.getItem('registeredFaces');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return [];
    }
  }

  saveRegisteredFaces(faces) {
    try {
      localStorage.setItem('registeredFaces', JSON.stringify(faces));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }
}

export default new FaceRecognitionService();