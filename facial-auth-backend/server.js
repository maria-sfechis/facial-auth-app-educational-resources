import nodemailer from 'nodemailer';
import express, { json } from 'express';
import { createConnection } from 'mysql2';
import cors from 'cors';
import multer from 'multer';
import fs, { readFileSync } from 'fs';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import https from 'https';
import { encrypt, decrypt } from './encryption.js';
// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Debug code:
console.log('=== Environment Debug ===');
console.log('Current directory:', __dirname);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('PORT:', process.env.PORT);
console.log('ENCRYPTION_KEY exists:', !!process.env.ENCRYPTION_KEY);
console.log('ENCRYPTION_KEY length:', process.env.ENCRYPTION_KEY?.length);
console.log('All env keys:', Object.keys(process.env).filter(key => key.includes('DB_') || 
             key.includes('ENCRYPTION_') || key === 'PORT'));
console.log('======================');

const app = express();
app.use(cors());
app.use(json({ limit: '50mb' }));

// Create MySQL connection
const db = createConnection({
  host: 'localhost',
  user: 'root',
  password: 'MariaSfechis1508!',
  database: 'facial_auth_system'
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Convert callbacks to promises
const dbAsync = db.promise();
// Connect to Yahoo Mail service
const emailTransporter = nodemailer.createTransport({
  service: 'yahoo', // or 'outlook', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const verificationCodes = new Map();

// Clean up expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of verificationCodes.entries()) {
    if (now > data.expires) {
      verificationCodes.delete(email);
    }
  }
}, 5 * 60 * 1000);

// Hardcoded resources data
const hardcodedResources = {
  'Study Rooms': [
    // MAIN - Clădirea Centrala UTCN
    { id: 1, name: 'Room MAIN-201', capacity: 6, available: true, location: 'Clădirea Centrala UTCN, Floor 2', building: 'MAIN', buildingName: 'Clădirea Centrala UTCN', amenities: ['Whiteboard', 'Projector', 'AC'] },
    { id: 2, name: 'Room MAIN-202', capacity: 8, available: true, location: 'Clădirea Centrala UTCN, Floor 2', building: 'MAIN', buildingName: 'Clădirea Centrala UTCN', amenities: ['Whiteboard', 'Smart TV'] },
    { id: 3, name: 'Conference Room MAIN-301', capacity: 20, available: true, location: 'Clădirea Centrala UTCN, Floor 3', building: 'MAIN', buildingName: 'Clădirea Centrala UTCN', amenities: ['Whiteboard', 'Projector', 'Video Conference'] },
    
    // AC - Facultatea de Automatica si Calculatoare
    { id: 4, name: 'Room AC-101', capacity: 4, available: true, location: 'Facultatea de Automatică și Calculatoare, Floor 1', building: 'AC', buildingName: 'Facultatea de Automatică și Calculatoare', amenities: ['Whiteboard', 'Computer'] },
    { id: 5, name: 'Room AC-205', capacity: 10, available: true, location: 'Facultatea de Automatică și Calculatoare, Floor 2', building: 'AC', buildingName: 'Facultatea de Automatică și Calculatoare', amenities: ['Whiteboard', 'Projector', 'Computer'] },
    { id: 6, name: 'Study Pod AC-305', capacity: 3, available: true, location: 'Facultatea de Automatică și Calculatoare, Floor 3', building: 'AC', buildingName: 'Facultatea de Automatică și Calculatoare', amenities: ['Quiet Space', 'Power Outlets'] },
    
    // IE - Facultatea de Inginerie Electrica
    { id: 7, name: 'Room IE-101', capacity: 8, available: true, location: 'Facultatea de Inginerie Electrică, Floor 1', building: 'IE', buildingName: 'Facultatea de Inginerie Electrică', amenities: ['Whiteboard', 'Lab Equipment'] },
    { id: 8, name: 'Group Study IE-204', capacity: 12, available: true, location: 'Facultatea de Inginerie Electrică, Floor 2', building: 'IE', buildingName: 'Facultatea de Inginerie Electrică', amenities: ['Whiteboard', 'Smart TV', 'Collaborative Space'] }
  ],

  'Computer Labs': [
    // AC - Facultatea de Automatica si Calculatoare
    { id: 9, name: 'Lab AC-Programming', computers: 30, capacity: 30, available: true, location: 'Facultatea de Automatică și Calculatoare, Floor 1', building: 'AC', buildingName: 'Facultatea de Automatică și Calculatoare', amenities: ['High-spec PCs', 'Development Software', 'Linux/Windows'] },
    { id: 10, name: 'Lab AC-AI/ML', computers: 25, capacity: 25, available: true, location: 'Facultatea de Automatică și Calculatoare, Floor 2', building: 'AC', buildingName: 'Facultatea de Automatică și Calculatoare', amenities: ['GPU Workstations', 'AI/ML Software', 'CUDA Support'] },
    { id: 11, name: 'Lab AC-Networks', computers: 20, capacity: 20, available: true, location: 'Facultatea de Automatică și Calculatoare, Floor 3', building: 'AC', buildingName: 'Facultatea de Automatică și Calculatoare', amenities: ['Cisco Equipment', 'Network Simulators', 'Server Room Access'] },
    
    // RES - Centrul de Cercetare si Inovare
    { id: 12, name: 'Research Lab RES-Data', computers: 18, capacity: 18, available: true, location: 'Centrul de Cercetare și Inovare, Floor 1', building: 'RES', buildingName: 'Centrul de Cercetare și Inovare', amenities: ['Research PCs', 'Data Analysis Software', 'Cloud Access'] },
    { id: 13, name: 'Innovation Lab RES-IoT', computers: 15, capacity: 15, available: true, location: 'Centrul de Cercetare și Inovare, Floor 2', building: 'RES', buildingName: 'Centrul de Cercetare și Inovare', amenities: ['IoT Devices', 'Raspberry Pi', 'Arduino Kits'] },
    
    // IE - Facultatea de Inginerie Electrica  
    { id: 14, name: 'Lab IE-Electronics', computers: 22, capacity: 22, available: true, location: 'Facultatea de Inginerie Electrică, Floor 1', building: 'IE', buildingName: 'Facultatea de Inginerie Electrică', amenities: ['CAD Software', 'Simulation Tools', 'Electronics Equipment'] }
  ],

  'Equipment': [
    // MAIN - Clădirea Centrala UTCN
    { id: 15, name: 'Projector Cart MAIN-A', quantity: 3, capacity: 1, available: true, location: 'Equipment Room MAIN-001', building: 'MAIN', buildingName: 'Clădirea Centrala UTCN', amenities: ['4K Projector', 'Laptop Compatible', 'Remote', 'Cables'] },
    { id: 16, name: 'Portable Whiteboard MAIN', quantity: 5, capacity: 1, available: true, location: 'Equipment Storage MAIN', building: 'MAIN', buildingName: 'Clădirea Centrala UTCN', amenities: ['Mobile', 'Double-sided', 'Markers Included'] },
    
    // AC - Facultatea de Automatica si Calculatoare
    { id: 17, name: 'Laptop Cart AC (30 units)', quantity: 2, capacity: 30, available: true, location: 'Tech Storage AC', building: 'AC', buildingName: 'Facultatea de Automatică și Calculatoare', amenities: ['30 Programming Laptops', 'Development Setup', 'Security Lock'] },
    { id: 18, name: 'VR Headset Kit AC', quantity: 6, capacity: 1, available: true, location: 'Innovation Lab AC', building: 'AC', buildingName: 'Facultatea de Automatică și Calculatoare', amenities: ['Oculus Quest 3', 'Controllers', 'VR Development Software'] },
    { id: 19, name: '3D Printer AC', quantity: 4, capacity: 1, available: true, location: 'Maker Space AC', building: 'AC', buildingName: 'Facultatea de Automatică și Calculatoare', amenities: ['PLA/ABS Compatible', 'CAD Software Access', 'Printing Materials'] },
    
    // RES - Centrul de Cercetare si Inovare
    { id: 20, name: 'Research Equipment Kit RES', quantity: 3, capacity: 1, available: true, location: 'Research Lab RES', building: 'RES', buildingName: 'Centrul de Cercetare și Inovare', amenities: ['Sensors', 'Measurement Tools', 'Data Loggers'] },
    { id: 21, name: 'Video Recording Kit RES', quantity: 4, capacity: 1, available: true, location: 'Media Center RES', building: 'RES', buildingName: 'Centrul de Cercetare și Inovare', amenities: ['4K Camera', 'Tripod', 'Audio Equipment', 'Editing Software'] },
    
    // IE - Facultatea de Inginerie Electrica
    { id: 22, name: 'Electronics Kit IE', quantity: 8, capacity: 1, available: true, location: 'Lab Storage IE', building: 'IE', buildingName: 'Facultatea de Inginerie Electrică', amenities: ['Oscilloscope', 'Function Generator', 'Multimeter', 'Components'] },
    { id: 23, name: 'Power Tools Kit IE', quantity: 3, capacity: 1, available: true, location: 'Workshop IE', building: 'IE', buildingName: 'Facultatea de Inginerie Electrică', amenities: ['Soldering Station', 'Power Supplies', 'Safety Equipment'] }
  ],

  'Library Resources': [
    // LIB - Biblioteca Centrala Universitara
    { id: 24, name: 'Private Study Booth LIB', quantity: 12, capacity: 1, available: true, location: 'Biblioteca Centrală Universitară, Floor 2', building: 'LIB', buildingName: 'Biblioteca Centrală Universitară', amenities: ['Quiet Environment', 'Power Outlets', 'Good Lighting', 'WiFi'] },
    { id: 25, name: 'Group Study Area LIB', quantity: 6, capacity: 8, available: true, location: 'Biblioteca Centrală Universitară, Floor 1', building: 'LIB', buildingName: 'Biblioteca Centrală Universitară', amenities: ['Collaborative Space', 'Whiteboard', 'Projector', 'Group Tables'] },
    { id: 26, name: 'Research Carrel LIB', quantity: 8, capacity: 1, available: true, location: 'Biblioteca Centrală Universitară, Floor 3', building: 'LIB', buildingName: 'Biblioteca Centrală Universitară', amenities: ['Private Desk', 'Computer Access', 'Research Databases', 'Printing'] },
    
    // Digital Resources (Available from all buildings)
    { id: 27, name: 'Digital Library Access', type: 'Online', available: true, location: 'Online Platform', building: 'VIRTUAL', buildingName: 'Online Platform', amenities: ['24/7 Access', 'Academic Papers', 'E-books', 'Journals'] },
    { id: 28, name: 'Research Database Premium', type: 'Online', available: true, location: 'Online Platform', building: 'VIRTUAL', buildingName: 'Online Platform', amenities: ['IEEE Xplore', 'ACM Digital Library', 'Springer', 'ScienceDirect'] },
    { id: 29, name: 'Engineering Software Access', type: 'Online', available: true, location: 'Online Platform', building: 'VIRTUAL', buildingName: 'Online Platform', amenities: ['MATLAB', 'AutoCAD', 'SolidWorks', 'LabVIEW'] }
  ]
};

// Register new user
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, studentId, descriptor } = req.body;
    
    // Trim and validate inputs
    const trimmedData = {
      name: name?.trim(),
      email: email?.trim().toLowerCase(),
      studentId: studentId?.trim()
    };
    
    // Check for empty fields
    if (!trimmedData.name || !trimmedData.email || !trimmedData.studentId) {
      return res.status(400).json({ 
        error: 'All fields are required and cannot be empty or contain only spaces' 
      });
    }
    
    // Validate name
    if (trimmedData.name.length < 2) {
      return res.status(400).json({ 
        error: 'Name must be at least 2 characters long' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@student\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedData.email)) {
      return res.status(400).json({ 
        error: 'University email must be in the format: yourname@student.university.edu' 
      });
    }
    
    // Validate Student ID format
    const studentIdRegex = /^\d{8}$/;
    if (!studentIdRegex.test(trimmedData.studentId)) {
      return res.status(400).json({ 
        error: 'Student ID must be exactly 8 digits (numbers only)' 
      });
    }
    
    // Check if user already exists with specific error messages
    const [existingEmail] = await dbAsync.query(
      'SELECT id FROM users WHERE email = ?',
      [trimmedData.email]
    );
    
    const [existingStudentId] = await dbAsync.query(
      'SELECT id FROM users WHERE student_id = ?',
      [trimmedData.studentId]
    );
    
    if (existingEmail.length > 0) {
      return res.status(400).json({ 
        error: 'This email address is already registered. Please use a different email or try logging in.' 
      });
    }
    
    if (existingStudentId.length > 0) {
      return res.status(400).json({ 
        error: 'This Student ID is already registered. Each Student ID can only be used once.' 
      });
    }
    
    // Encrypt the face descriptor
    const encryptedDescriptor = encrypt(descriptor);

    // Default notification preferences
    const defaultNotificationPreferences = {
      email: true,
      browser: true,
      reminder_time: 30
    };

    // Insert new user with notification preferences
    const [result] = await dbAsync.query(
      `INSERT INTO users (
        name, email, student_id, face_descriptor, 
        face_descriptor_encrypted, encryption_iv, notification_preferences
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        trimmedData.name,
        trimmedData.email,
        trimmedData.studentId,
        JSON.stringify(descriptor),
        encryptedDescriptor.data,
        encryptedDescriptor.iv,
        JSON.stringify(defaultNotificationPreferences)
      ]
    );
    
    res.json({ 
      success: true, 
      user: {
        id: result.insertId,
        name: trimmedData.name,
        email: trimmedData.email,
        studentId: trimmedData.studentId,
        notification_preferences: defaultNotificationPreferences
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration. Please try again.' });
  }
});

app.post('/api/check-student-id', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    console.log('🔍 Checking Student ID uniqueness:', studentId);
    
    // Validate the student ID format first
    if (!studentId) {
      return res.status(400).json({ 
        error: 'Student ID is required',
        exists: false 
      });
    }
    
    // Check if it's exactly 8 digits
    const studentIdRegex = /^\d{8}$/;
    if (!studentIdRegex.test(studentId)) {
      return res.status(400).json({ 
        error: 'Student ID must be exactly 8 digits',
        exists: false 
      });
    }
    
    // Check if Student ID already exists in database
    const [existing] = await dbAsync.query(
      'SELECT id FROM users WHERE student_id = ?',
      [studentId.trim()]
    );
    
    const exists = existing.length > 0;
    
    console.log(`📋 Student ID ${studentId} ${exists ? 'already exists' : 'is available'}`);
    
    res.json({ 
      exists: exists,
      message: exists ? 'Student ID already registered' : 'Student ID available'
    });
    
  } catch (error) {
    console.error('❌ Student ID check error:', error);
    res.status(500).json({ 
      error: 'Server error checking Student ID',
      exists: false 
    });
  }
});

// Get all users (for face matching)
app.get('/api/users/descriptors', async (req, res) => {
    try {
        console.log('Fetching users for face matching...');
        // ✅ Include și coloana face_descriptor pentru fallback
        const [users] = await dbAsync.query(
            'SELECT id, name, email, student_id, face_descriptor, face_descriptor_encrypted, encryption_iv FROM users'
        );
        console.log(`Found ${users.length} users`);
        // Decrypt descriptors cu recovery mechanism
        const usersWithDescriptors = users.map(user => {
            try {
                let descriptor;
                console.log(`Processing user ${user.id}: ${user.name}`);
                // Strategy 1: Try encrypted data first
                if (user.face_descriptor_encrypted && user.encryption_iv) {
                try {
                    const encryptedData = {
                        data: user.face_descriptor_encrypted,
                        iv: user.encryption_iv
                    };
                    descriptor = decrypt(encryptedData);
                    console.log(`✅ Successfully decrypted user ${user.id}: ${user.name}`);
                } catch (decryptError) {
                    console.warn(`⚠️ Decryption failed for user ${user.id}: ${user.name} - ${decryptError.message}`);
                    // Strategy 2: Fallback to unencrypted descriptor
                    if (user.face_descriptor) {
                        try {
                            descriptor = typeof user.face_descriptor === 'string' 
                            ? JSON.parse(user.face_descriptor) 
                            : user.face_descriptor;
                            console.log(`🔄 Using fallback descriptor for user ${user.id}: ${user.name}`);
                        } catch (parseError) {
                            console.error(`❌ Fallback parse failed for user ${user.id}: ${user.name} - ${parseError.message}`);
                            return null; // Skip this user
                        }
                    } else {
                        console.error(`❌ No fallback descriptor for user ${user.id}: ${user.name}`);
                        return null; // Skip this user
                    }
                }
            } else if (user.face_descriptor) {
                // Strategy 3: Use unencrypted descriptor directly
                try {
                    descriptor = typeof user.face_descriptor === 'string' 
                    ? JSON.parse(user.face_descriptor) 
                    : user.face_descriptor;
                    console.log(`📄 Using unencrypted descriptor for user ${user.id}: ${user.name}`);
                } catch (parseError) {
                    console.error(`❌ Parse failed for user ${user.id}: ${user.name} - ${parseError.message}`);
                    return null; // Skip this user
                }
            } else {
                console.warn(`⚠️ No face descriptor found for user ${user.id}: ${user.name}`);
                return null; // Skip this user
            }
                // Validate descriptor array
            if (!Array.isArray(descriptor)) {
                console.error(`❌ Descriptor not array for user ${user.id}: type=${typeof descriptor}`);
                return null;
            }
            if (descriptor.length !== 128) {
                console.error(`❌ Invalid descriptor length for user ${user.id}: length=${descriptor.length}, expected=128`);
                return null;
            }
            // Additional validation: check if all values are numbers
            const hasInvalidValues = descriptor.some(val => typeof val !== 'number' || isNaN(val));
            if (hasInvalidValues) {
                console.error(`❌ Descriptor contains invalid values for user ${user.id}`);
                return null;
            }
            console.log(`✅ Valid descriptor for user ${user.id}: ${user.name} (length: ${descriptor.length})`);
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                student_id: user.student_id,
                face_descriptor: descriptor
            };
        } catch (error) {
            console.error(`❌ Error processing user ${user.id}: ${user.name} -`, error.message);
            return null;
        }
    }).filter(user => user !== null);
    console.log(`✅ Successfully processed ${usersWithDescriptors.length}/${users.length} users`);
    if (usersWithDescriptors.length === 0) {
        console.warn('⚠️ No valid users found for face matching');
        return res.json([]);
    }
    res.json(usersWithDescriptors);
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/test-yahoo-email', async (req, res) => {
  try {
    console.log('Testing Yahoo email configuration...');
    
    const testEmail = {
      from: `"University Portal" <${process.env.EMAIL_USER}>`,
      to: req.body.email || process.env.EMAIL_USER, // Send to yourself for testing
      subject: '✅ Yahoo Email Test - University Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #7986cb 0%, #64b5f6 100%); 
                          color: white; padding: 20px; border-radius: 12px; display: inline-block;
                          box-shadow: 0 4px 15px rgba(121, 134, 203, 0.3);">
                <h2 style="margin: 0; font-size: 20px;">🎓 University Portal</h2>
              </div>
            </div>
            
            <h3 style="color: #1f2937; text-align: center;">Yahoo Email Test Successful! 🎉</h3>
            
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); 
                        padding: 25px; border-radius: 12px; margin: 25px 0; 
                        border: 2px solid #bae6fd;">
              <p style="margin: 0 0 15px 0; font-weight: bold; color: #1e40af;">
                ✅ If you're reading this email, your Yahoo configuration is working perfectly!
              </p>
              <p style="margin: 0; color: #374151;">
                Your Email OTP login system is ready to use with Yahoo Mail.
              </p>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #7986cb;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #374151;">Configuration Details:</p>
              <ul style="margin: 10px 0 0 0; color: #6b7280;">
                <li>Email Service: Yahoo Mail</li>
                <li>SMTP Server: smtp.mail.yahoo.com</li>
                <li>Port: 587 (TLS)</li>
                <li>From Address: ${process.env.EMAIL_USER}</li>
                <li>Authentication: App Password ✓</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                          color: white; padding: 15px 25px; border-radius: 8px; display: inline-block;
                          font-weight: bold;">
                🚀 Ready for OTP Login!
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; 
                        border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 14px;">
              <p>Sent via Yahoo Mail • University Portal System</p>
              <p style="margin: 5px 0 0 0;">This is an automated test message</p>
            </div>
          </div>
        </div>
      `
    };
    
    await emailTransporter.sendMail(testEmail);
    
    console.log('✅ Yahoo test email sent successfully');
    res.json({ 
      success: true, 
      message: 'Yahoo test email sent successfully!',
      from: process.env.EMAIL_USER,
      to: req.body.email || process.env.EMAIL_USER,
      provider: 'Yahoo Mail'
    });
    
  } catch (error) {
    console.error('❌ Yahoo email test failed:', error);
    
    let errorMessage = error.message;
    let troubleshootingTip = '';
    
    if (error.code === 'EAUTH') {
      troubleshootingTip = 'Authentication failed. Make sure you are using a Yahoo App Password, not your regular password.';
    } else if (error.code === 'ECONNECTION') {
      troubleshootingTip = 'Connection failed. Check your internet connection and Yahoo SMTP settings.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      troubleshooting: troubleshootingTip,
      details: 'Yahoo requires App Passwords for SMTP. Check setup instructions.'
    });
  }
});


app.post('/api/auth/send-code', async (req, res) => {
  console.log('🚀 SEND-CODE ENDPOINT HIT!');
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const [users] = await dbAsync.query(
      'SELECT id, name FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clean up any existing codes for this email
    await dbAsync.query(
      'DELETE FROM otp_codes WHERE email = ?',
      [email]
    );

    // Store the new code in database
    await dbAsync.query(
      'INSERT INTO otp_codes (email, code, expires_at, user_id, user_name) VALUES (?, ?, ?, ?, ?)',
      [
        email.toLowerCase(),
        code,
        new Date(Date.now() + 5 * 60 * 1000),
        users[0].id,    // ← Make sure this is being stored
        users[0].name 
      ]
    );

    // Send email using your existing emailTransporter
    const mailOptions = {
        from: `"University Portal" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 Your Login Code - University Portal',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Login Verification Code</title>
            <style>
                body { 
                font-family: Arial, Helvetica, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 0;
                background-color: #f5f5f5;
                }
                .email-container { 
                max-width: 600px; 
                margin: 20px auto; 
                background-color: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }
                .header { 
                background: linear-gradient(135deg, #7986cb 0%, #64b5f6 100%);
                color: white;
                text-align: center; 
                padding: 30px 20px;
                }
                .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: bold;
                }
                .content {
                padding: 40px 30px;
                }
                .greeting {
                font-size: 18px;
                color: #1f2937;
                margin-bottom: 20px;
                }
                .code-section { 
                background: linear-gradient(135deg, #f8fafc 0%, #e1f5fe 100%); 
                padding: 30px; 
                border-radius: 12px; 
                text-align: center; 
                margin: 30px 0; 
                border: 3px solid #e2e8f0;
                }
                .code-label {
                font-size: 16px;
                color: #374151;
                margin-bottom: 15px;
                font-weight: bold;
                }
                .verification-code { 
                font-size: 36px; 
                font-weight: bold; 
                color: #7986cb; 
                letter-spacing: 8px; 
                margin: 15px 0;
                padding: 15px 25px;
                background: white;
                border-radius: 8px;
                display: inline-block;
                border: 2px solid #7986cb;
                box-shadow: 0 2px 10px rgba(121, 134, 203, 0.2);
                }
                .instructions {
                background: #f0f9ff;
                border: 2px solid #bae6fd;
                padding: 20px;
                border-radius: 10px;
                margin: 25px 0;
                }
                .warning { 
                background: #fef2f2; 
                border: 2px solid #fecaca; 
                padding: 20px; 
                border-radius: 10px; 
                margin: 25px 0;
                }
                .footer { 
                background: #f9fafb;
                text-align: center; 
                padding: 25px;
                color: #6b7280; 
                font-size: 14px;
                border-top: 1px solid #e5e7eb;
                }
                .highlight { 
                color: #7986cb; 
                font-weight: bold; 
                }
                .yahoo-badge {
                display: inline-block;
                background: #7C3AED;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                margin-top: 10px;
                }
            </style>
            </head>
            <body>
            <div class="email-container">
                <div class="header">
                <h1>🎓 University Portal</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Secure Access System</p>
                </div>
                
                <div class="content">
                <div class="greeting">Hello ${users[0].name}! 👋</div>
                
                <p>We received a request to access your University Portal account. Use the verification code below to complete your login:</p>
                
                <div class="code-section">
                    <div class="code-label">Your Verification Code</div>
                    <div class="verification-code">${code}</div>
                    <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 14px;">
                    Valid for 5 minutes only
                    </p>
                </div>
                
                <div class="instructions">
                    <h4 style="margin: 0 0 15px 0; color: #1e40af;">📱 How to use this code:</h4>
                    <ol style="margin: 0; padding-left: 20px; color: #374151;">
                    <li>Return to the University Portal login page</li>
                    <li>Enter this 6-digit code in the verification field</li>
                    <li>Click "Verify & Login" to access your account</li>
                    </ol>
                </div>
                
                <div class="warning">
                    <h4 style="margin: 0 0 15px 0; color: #dc2626;">🔒 Security Reminder:</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #374151;">
                    <li><strong>This code expires in 5 minutes</strong></li>
                    <li>Never share this code with anyone</li>
                    <li>University staff will never ask for verification codes</li>
                    <li>If you didn't request this login, please ignore this email</li>
                    </ul>
                </div>
                
                <p style="margin-top: 30px; color: #6b7280;">
                    Need help? Contact IT Support: <span class="highlight">support@university.edu</span>
                </p>
                </div>
                
                <div class="footer">
                <p><strong>University Resource Management System</strong></p>
                <div class="yahoo-badge">Sent via Yahoo Mail</div>
                <p style="margin-top: 15px;">This is an automated security message • Do not reply</p>
                </div>
            </div>
            </body>
            </html>
        `
    };

    await emailTransporter.sendMail(mailOptions);
    
    console.log(`📧 OTP code sent to ${email}`);
    res.json({ success: true, message: 'Code sent successfully' });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ error: 'Failed to send code' });
  }
});


app.post('/api/auth/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    console.log('🔍 Verify code request:', { email, code });
    
    // Get stored verification data from database
    const [storedCodes] = await dbAsync.query(
      'SELECT * FROM otp_codes WHERE email = ? AND expires_at > NOW() AND used = FALSE ORDER BY created_at DESC LIMIT 1',
      [email.toLowerCase()]
    );
    
    console.log('🔍 Found stored codes:', storedCodes);
    
    if (storedCodes.length === 0) {
      console.log('❌ No active codes found');
      return res.status(400).json({ 
        error: 'No active verification code found. Please request a new code.',
        errorType: 'expired_or_not_found'
      });
    }
    
    const storedData = storedCodes[0];
    console.log('🔍 Stored code data:', storedData);
    
    // Check if the code matches
    if (storedData.code !== code) {
      console.log('❌ Code mismatch:', { provided: code, stored: storedData.code });
      
      return res.status(400).json({ 
        error: 'Incorrect verification code. Please try again.',
        errorType: 'incorrect_code'
      });
    }
    
    console.log('✅ Code matches! Looking for user:', storedData.user_id);
    
    // Code is correct - mark as used and proceed with login
    await dbAsync.query(
      'UPDATE otp_codes SET used = TRUE WHERE id = ?',
      [storedData.id]
    );
    
    // Get complete user data from database
    const [users] = await dbAsync.query(
      `SELECT id, name, email, student_id FROM users WHERE id = ?`,
      [storedData.user_id]
    );
    
    console.log('🔍 Found users:', users);
    
    if (users.length === 0) {
      console.log('❌ User not found with ID:', storedData.user_id);
      return res.status(404).json({ error: 'User account not found' });
    }
    
    const user = users[0];
    console.log('✅ User found:', user.name);
    
    // Update last login timestamp
    await dbAsync.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );
    
    console.log(`✅ Login successful for ${user.name}`);
    
    // Return user data
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        student_id: user.student_id
      }
    });
    
  } catch (error) {
    console.error('❌ Verify code error:', error);
    res.status(500).json({ 
      error: 'Verification failed. Please try again.' 
    });
  }
});

// Add this function to clean up expired codes periodically
const cleanupExpiredCodes = async () => {
  try {
    const [result] = await dbAsync.query(
      'DELETE FROM otp_codes WHERE expires_at < NOW()'
    );
    if (result.affectedRows > 0) {
      console.log(`🧹 Cleaned up ${result.affectedRows} expired OTP codes`);
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredCodes, 60 * 60 * 1000);
// Run cleanup on server start
cleanupExpiredCodes();

app.get('/api/admin/otp-stats', async (req, res) => {
  try {
    // Only show this in development or to admins
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const stats = {
      active_codes: verificationCodes.size,
      codes_by_email: Array.from(verificationCodes.entries()).map(([email, data]) => ({
        email,
        expires_in: Math.max(0, Math.floor((data.expires - Date.now()) / 1000)),
        attempts: data.attempts,
        created_ago: Math.floor((Date.now() - data.createdAt) / 1000)
      }))
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

const testEmailConfig = async () => {
  try {
    await emailTransporter.verify();
    console.log('✅ Email service is ready');
  } catch (error) {
    console.error('❌ Email service configuration error:', error.message);
    console.log('📧 Please check your email settings in the code');
  }
};

// Call this when your server starts
testEmailConfig();

// Get all available resources with filtering
app.get('/api/resources', async (req, res) => {
    try {
        const { date, startTime, endTime, category, minCapacity, building } = req.query;
        console.log('Filtering resources with:', { date, startTime, endTime, category, minCapacity, building });
        console.log('🚀 === RESOURCE REQUEST DEBUG ===');
        console.log('📥 Received query parameters:', req.query);
        console.log('🏢 Building parameter:', building);
        console.log('📂 Category parameter:', category);
        console.log('👥 MinCapacity parameter:', minCapacity);
        console.log('📅 Date/Time parameters:', { date, startTime, endTime });
        
        let resourceQuery = `
            SELECT
                r.*,
                b.name as building_name,
                b.code as building_code,
                b.address as building_address,
                b.latitude as building_latitude,
                b.longitude as building_longitude
            FROM resources r
            LEFT JOIN buildings b ON r.building_id = b.id
            WHERE r.available = TRUE
        `;
        const queryParams = [];

        // Add building filter
        if (building) {
            resourceQuery += ` AND b.code = ?`;
            queryParams.push(building);
        }
        
        // Add category filter
        if (category) {
            resourceQuery += ` AND r.category = ?`;
            queryParams.push(category);
        }
    
        // Add capacity filter
        if (minCapacity) {
            resourceQuery += ` AND r.capacity >= ?`;
            queryParams.push(parseInt(minCapacity));
        }
    
        let availableResources = {};

        try {
            // Try to get resources from database first
            console.log('🗃️ Trying database query...');
            const [dbResources] = await dbAsync.query(resourceQuery, queryParams);
            console.log('📊 Database returned:', dbResources ? dbResources.length : 0, 'resources');
            if (dbResources && dbResources.length > 0) {
                // Group by category
                dbResources.forEach(resource => {
                    if (!availableResources[resource.category]) {
                        availableResources[resource.category] = [];
                    }

                    availableResources[resource.category].push({
                        ...resource,
                        building_info: resource.building_name ? {
                            name: resource.building_name,
                            code: resource.building_code,
                            address: resource.building_address,
                            location: {
                                latitude: resource.building_latitude,
                                longitude: resource.building_longitude
                            }
                        } : null
                    });
                });
                console.log('✅ Using DATABASE resources, categories found:', Object.keys(availableResources));
            } else {
                console.log('⚠️ Database returned no resources, will use fallback');
            }
        } catch (dbError) {
            console.log('❌ Database resources not available, using hardcoded data:', dbError.message);
        }

        // Fallback to hardcoded resources with enhanced filtering
        if (Object.keys(availableResources).length === 0) {
            console.log('🔄 Using HARDCODED resources fallback');
            console.log('Using hardcoded resources with filters:', { category, building, minCapacity });
            
            // Start with all hardcoded resources
            let filteredResources = { ...hardcodedResources };
            
            // Apply category filter first
            if (category) {
                if (filteredResources[category]) {
                    filteredResources = { [category]: filteredResources[category] };
                } else {
                    filteredResources = {}; // No resources in this category
                }
            }
            
            // Apply building filter
            if (building && Object.keys(filteredResources).length > 0) {
                console.log(`🏢 Applying building filter: "${building}"`);
                console.log(`📋 Categories before building filter:`, Object.keys(filteredResources));
        
                Object.keys(filteredResources).forEach(cat => {
                    console.log(`\n🔍 Checking category "${cat}" with ${filteredResources[cat].length} resources:`);
                    const originalCount = filteredResources[cat].length;
                    filteredResources[cat] = filteredResources[cat].filter(resource => {
                        const resourceBuilding = resource.building;
                        const matches = resourceBuilding === building;
                        console.log(`Checking resource "${resource.name}" in building "${resourceBuilding}" against filter "${building}"`);
                        return matches;
                    });
                    const newCount = filteredResources[cat].length;
                    console.log(`  ✅ Category "${cat}": ${originalCount} → ${newCount} resources after building filter`);
                    
                    // Remove empty categories
                    if (filteredResources[cat].length === 0) {
                        console.log(`  🗑️ Removing empty category "${cat}"`);
                        delete filteredResources[cat];
                    }
                });
                console.log(`🏁 Final categories after building filter:`, Object.keys(filteredResources));
            } else {
                console.log(`⚠️ No building filter applied. Building parameter: "${building}"`);
            }
            
            // Apply capacity filter
            if (minCapacity && Object.keys(filteredResources).length > 0) {
                const minCap = parseInt(minCapacity);
                Object.keys(filteredResources).forEach(cat => {
                    filteredResources[cat] = filteredResources[cat].filter(resource => {
                        const capacity = resource.capacity || resource.computers || resource.quantity || resource.maxUsers || 1;
                        return capacity >= minCap;
                    });
                    
                    // Remove empty categories
                    if (filteredResources[cat].length === 0) {
                        delete filteredResources[cat];
                    }
                });
            }
            
            availableResources = filteredResources;
            console.log('After filtering, available categories:', Object.keys(availableResources));
            console.log('Resources per category:', Object.fromEntries(
                Object.entries(availableResources).map(([cat, resources]) => [cat, resources.length])
            ));
        }
    
        // If date and time are provided, check for conflicts with existing reservations
        if (date && startTime && endTime) {
            try {
                const [bookedResources] = await dbAsync.query(`
                    SELECT DISTINCT resource_name, resource_type
                    FROM reservations
                    WHERE date = ?
                    AND status = 'active'
                    AND ((start_time <= ? AND end_time > ?)
                    OR (start_time < ? AND end_time >= ?)
                    OR (start_time >= ? AND end_time <= ?))
                `, [date, startTime, startTime, endTime, endTime, startTime, endTime]);
          
                // Mark booked resources as unavailable
                bookedResources.forEach(booked => {
                    if (availableResources[booked.resource_type]) {
                        availableResources[booked.resource_type] = availableResources[booked.resource_type].map(resource => {
                            if (resource.name === booked.resource_name) {
                                return { ...resource, available: false, bookedReason: 'Reserved for this time slot' };
                            }
                            return resource;
                        });
                    }
                });
            } catch (dbError) {
                console.log('Could not check reservations, assuming all available');
            }
        }
    
        // Remove empty categories
        Object.keys(availableResources).forEach(cat => {
            if (availableResources[cat].length === 0) {
                delete availableResources[cat];
            }
        });    
    
        console.log(`Returning ${Object.keys(availableResources).length} categories with resources`);
        res.json({
            resources: availableResources,
            filters: { date, startTime, endTime, category, minCapacity, building },
            data_source: Object.keys(availableResources).length > 0 ? 'hardcoded_filtered' : 'empty',
            total_resources: Object.values(availableResources).reduce((total, resources) => total + resources.length, 0)
        });
    } catch (error) {
        console.error('Error fetching resources:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/resources/smart-suggestions', async (req, res) => {
  try {
    const { 
      reservationId, 
      resourceType, 
      buildingCode, 
      date, 
      startTime, 
      endTime, 
      peopleCount, 
      filters 
    } = req.body;

    console.log('🧠 Smart suggestions request:', { resourceType, buildingCode, filters });

    const suggestions = {
      quickBundles: [],
      categories: {}
    };

    // 1. Get building ID from building code
    const [buildings] = await dbAsync.query(
      'SELECT id FROM buildings WHERE code = ? AND is_active = TRUE',
      [buildingCode]
    );
    
    const buildingId = buildings[0]?.id;

    // 2. Create resource bundles based on reservation type
    const bundles = getResourceBundles(resourceType);
    suggestions.quickBundles = bundles;

    // 3. Get relevant resources based on filters
    let resourceQuery = `
      SELECT r.*, b.name as building_name, b.code as building_code
      FROM resources r
      LEFT JOIN buildings b ON r.building_id = b.id
      WHERE r.available = TRUE
    `;
    const queryParams = [];

    // Apply building filter
    if (filters.building === 'same' && buildingId) {
      resourceQuery += ' AND r.building_id = ?';
      queryParams.push(buildingId);
    }

    // Apply category filter
    if (filters.category === 'related') {
      const relatedCategories = getRelatedCategories(resourceType);
      if (relatedCategories.length > 0) {
        resourceQuery += ` AND r.category IN (${relatedCategories.map(() => '?').join(',')})`;
        queryParams.push(...relatedCategories);
      }
    }

    resourceQuery += ' ORDER BY r.category, r.name';

    const [resources] = await dbAsync.query(resourceQuery, queryParams);

    // 4. Group resources by category and add relevance scores
    resources.forEach(resource => {
      if (!suggestions.categories[resource.category]) {
        suggestions.categories[resource.category] = [];
      }
      
      suggestions.categories[resource.category].push({
        ...resource,
        relevanceScore: calculateRelevanceScore(resource, resourceType, peopleCount, buildingId)
      });
    });

    // 5. Sort by relevance within each category
    Object.keys(suggestions.categories).forEach(category => {
      suggestions.categories[category].sort((a, b) => b.relevanceScore - a.relevanceScore);
    });

    console.log('✅ Smart suggestions generated:', {
      bundlesCount: suggestions.quickBundles.length,
      categoriesCount: Object.keys(suggestions.categories).length
    });

    res.json(suggestions);
  } catch (error) {
    console.error('Smart suggestions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions for smart suggestions
const getResourceBundles = (resourceType) => {
  const bundles = {
    'Study Rooms': [
      {
        title: 'Study Session Bundle',
        description: 'Everything you need for productive studying',
        icon: '📚',
        resources: [
          { id: 'virtual-1', name: 'Whiteboard', category: 'Equipment' },
          { id: 'virtual-2', name: 'Study Timer', category: 'Study Aids' },
          { id: 'virtual-3', name: 'Microsoft Office 365', category: 'Software Licenses' }
        ]
      }
    ],
    'Computer Labs': [
      {
        title: 'Development Bundle',
        description: 'Essential tools for coding and development',
        icon: '💻',
        resources: [
          { id: 'virtual-4', name: 'Code Editor', category: 'Software Licenses' },
          { id: 'virtual-5', name: 'External Monitor', category: 'Equipment' },
          { id: 'virtual-6', name: 'Programming Tutorials', category: 'Learning Materials' }
        ]
      }
    ],
    'Recreational Facilities': [
      {
        title: 'Sports Bundle',
        description: 'Equipment for recreational activities',
        icon: '⚽',
        resources: [
          { id: 'virtual-7', name: 'Sports Equipment', category: 'Equipment' },
          { id: 'virtual-8', name: 'Sound System', category: 'Special Equipment' }
        ]
      }
    ]
  };
  
  return bundles[resourceType] || [];
};

const getRelatedCategories = (resourceType) => {
  const categoryMap = {
    'Study Rooms': ['Equipment', 'Software Licenses', 'Learning Materials', 'Study Aids'],
    'Computer Labs': ['Software Licenses', 'Equipment', 'Learning Materials'],
    'Medical Services': ['Special Equipment', 'Learning Materials'],
    'Recreational Facilities': ['Equipment', 'Special Equipment']
  };
  
  return categoryMap[resourceType] || [];
};

const calculateRelevanceScore = (resource, reservationType, peopleCount, buildingId) => {
  let score = 0;
  
  // Building match bonus
  if (resource.building_id === buildingId) {
    score += 30;
  }
  
  // Category relevance
  const relatedCategories = getRelatedCategories(reservationType);
  if (relatedCategories.includes(resource.category)) {
    score += 40;
  }
  
  // Capacity match
  if (resource.capacity && resource.capacity >= peopleCount) {
    score += 20;
  }
  
  // Availability bonus
  if (resource.available) {
    score += 10;
  }
  
  return score;
};

// 6. Get directions between two buildings
app.get('/api/directions/:fromCode/:toCode', async (req, res) => {
    try {
        const { fromCode, toCode } = req.params;
        const { mode = 'walking' } = req.query; // walking, driving, transit
    
        // Get both buildings
        const [buildings] = await dbAsync.query(`
            SELECT id, name, code, latitude, longitude, address 
            FROM buildings 
            WHERE code IN (?, ?) AND is_active = TRUE
        `, [fromCode, toCode]);
    
        if (buildings.length !== 2) {
            return res.status(404).json({ error: 'One or both buildings not found' });
        }
    
        const fromBuilding = buildings.find(b => b.code === fromCode);
        const toBuilding = buildings.find(b => b.code === toCode);
    
        // Calculate distance
        const distance = calculateDistance(
            fromBuilding.latitude, fromBuilding.longitude,
            toBuilding.latitude, toBuilding.longitude
        );
    
        // Estimate travel time based on mode
        const travelTimes = {
            walking: Math.round(distance * 12), // ~12 minutes per km walking
            driving: Math.round(distance * 3),  // ~3 minutes per km driving in city
            transit: Math.round(distance * 8)   // ~8 minutes per km including wait time
        };
    
        const directions = {
            from: {
                building: fromBuilding.name,
                code: fromBuilding.code,
                location: {
                    latitude: fromBuilding.latitude,
                    longitude: fromBuilding.longitude
                },
                address: fromBuilding.address
            },
            to: {
                building: toBuilding.name,
                code: toBuilding.code,
                location: {
                    latitude: toBuilding.latitude,
                    longitude: toBuilding.longitude
                },
                address: toBuilding.address
            },
            distance_km: parseFloat(distance.toFixed(2)),
            travel_mode: mode,
            estimated_time_minutes: travelTimes[mode] || travelTimes.walking,
            google_maps_url: `https://www.google.com/maps/dir/${fromBuilding.latitude},${fromBuilding.longitude}/${toBuilding.latitude},${toBuilding.longitude}`,
            instructions: `Traseu ${mode === 'walking' ? 'pe jos' : mode === 'driving' ? 'cu mașina' : 'cu transportul public'} de la ${fromBuilding.name} la ${toBuilding.name}`
        };
    
        res.json(directions);
    } catch (error) {
        console.error('Error getting directions:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper function to calculate distance between 2 coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in kilometers
    return d;
}

// 7. Update parking availability (for admin use or real-time updates)
app.put('/api/parking/:parkingId/availability', async (req, res) => {
    try {
        const { parkingId } = req.params;
        const { available_spaces } = req.body;
    
        if (available_spaces === undefined || available_spaces < 0) {
            return res.status(400).json({ error: 'Invalid available_spaces value' });
        }
    
        // Get current parking info
        const [parking] = await dbAsync.query(`
            SELECT total_spaces FROM parking_areas WHERE id = ? AND is_active = TRUE
        `, [parkingId]);
    
        if (parking.length === 0) {
            return res.status(404).json({ error: 'Parking area not found' });
        }
    
        if (available_spaces > parking[0].total_spaces) {
            return res.status(400).json({ 
                error: `Available spaces cannot exceed total spaces (${parking[0].total_spaces})` 
            });
        }
    
        // Update availability
        await dbAsync.query(`
            UPDATE parking_areas 
            SET available_spaces = ?, last_updated = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [available_spaces, parkingId]);
    
        res.json({ 
            success: true, 
            parking_id: parkingId,
            available_spaces: available_spaces,
            updated_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating parking availability:', error);
        res.status(500).json({ error: error.message });
    }
});


// Get specific resource details
app.get('/api/resources/:category/:resourceId', async (req, res) => {
  try {
    const { category, resourceId } = req.params;
    const { date, startTime, endTime } = req.query;
    
    if (!hardcodedResources[category]) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const resource = hardcodedResources[category].find(r => r.id === parseInt(resourceId));
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    // Get availability for the next 7 days
    let availabilityData = {};
    const dates = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });
    
    for (const checkDate of dates) {
      try {
        const [bookings] = await dbAsync.query(`
          SELECT start_time, end_time
          FROM reservations 
          WHERE resource_name = ? 
          AND date = ? 
          AND status = 'active'
          ORDER BY start_time
        `, [resource.name, checkDate]);
        
        availabilityData[checkDate] = {
          date: checkDate,
          bookings: bookings || [],
          is_available_for_requested_time: date && startTime && endTime ? 
            !(bookings || []).some(booking => 
              (startTime <= booking.start_time && endTime > booking.start_time) ||
              (startTime < booking.end_time && endTime >= booking.end_time) ||
              (startTime >= booking.start_time && endTime <= booking.end_time)
            ) : true
        };
      } catch (dbError) {
        console.log(`Database error for ${checkDate}, assuming available`);
        availabilityData[checkDate] = {
          date: checkDate,
          bookings: [],
          is_available_for_requested_time: true
        };
      }
    }
    
    res.json({
      resource: {
        ...resource,
        category,
        availability: availabilityData
      }
    });
  } catch (error) {
    console.error('Error fetching resource details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available resources for all categories
app.get('/api/resources/available', async (req, res) => {
    try {
        const { date, startTime, endTime, category } = req.query;
        
        console.log(`🔍 Checking availability for: ${category || 'all categories'} on ${date} from ${startTime} to ${endTime}`);
        
        let availableResources = {};
        
        // If no time specified, return all resources
        if (!date || !startTime || !endTime) {
            for (const [cat, resources] of Object.entries(hardcodedResources)) {
                if (!category || category === cat) {
                    availableResources[cat] = resources.map(resource => ({
                        ...resource,
                        available: true,
                        availability_status: 'available'
                    }));
                }
            }
            res.json(availableResources);
            return;
        }

        // Check availability for specific time slot
        let bookedNames = new Set();
        
        try {
            const [bookedResources] = await dbAsync.query(`
                SELECT DISTINCT resource_name, resource_type
                FROM reservations
                WHERE date = ?
                AND status = 'active'
                AND ((start_time <= ? AND end_time > ?)
                OR (start_time < ? AND end_time >= ?)
                OR (start_time >= ? AND end_time <= ?))
            `, [date, startTime, startTime, endTime, endTime, startTime, endTime]);

            bookedNames = new Set(bookedResources.map(r => r.resource_name));
        } catch (dbError) {
            console.log('Database not available, assuming all resources are available');
        }
        
        // Filter available resources
        for (const [cat, resources] of Object.entries(hardcodedResources)) {
            if (!category || category === cat) {
                const availableInCategory = resources.filter(resource => 
                    !bookedNames.has(resource.name)
                );
                
                if (availableInCategory.length > 0) {
                    availableResources[cat] = availableInCategory.map(resource => ({
                        ...resource,
                        available: true,
                        availability_status: 'available'
                    }));
                }
            }
        }

        console.log(`✅ Found ${Object.keys(availableResources).length} categories with available resources`);
        res.json(availableResources);
        
    } catch (error) {
        console.error('❌ Error checking availability:', error);
        
        // Fallback: return all resources as available
        const fallbackResources = {};
        for (const [cat, resources] of Object.entries(hardcodedResources)) {
            if (!category || category === cat) {
                fallbackResources[cat] = resources.map(resource => ({
                    ...resource,
                    available: true,
                    availability_status: 'available'
                }));
            }
        }
        
        res.json(fallbackResources);
    }
});

app.get('/api/resources/availability-summary', async (req, res) => {
    try {
        const { date, startTime, endTime } = req.query;
        
        console.log(`📊 Getting availability summary for ${date} ${startTime}-${endTime}`);
        
        // Use current time if not specified
        const checkDate = date || new Date().toISOString().split('T')[0];
        const checkStartTime = startTime || new Date().toTimeString().slice(0, 5);
        const checkEndTime = endTime || (() => {
            const end = new Date();
            end.setHours(end.getHours() + 2);
            return end.toTimeString().slice(0, 5);
        })();
        
        const summary = {};
        
        for (const [category, resources] of Object.entries(hardcodedResources)) {
            try {
                // Check database for bookings if available
                let bookedNames = new Set();
                
                try {
                    const [bookedInCategory] = await dbAsync.query(`
                        SELECT DISTINCT resource_name
                        FROM reservations
                        WHERE date = ?
                        AND status = 'active'
                        AND resource_type = ?
                        AND ((start_time <= ? AND end_time > ?)
                        OR (start_time < ? AND end_time >= ?)
                        OR (start_time >= ? AND end_time <= ?))
                    `, [checkDate, category, checkStartTime, checkStartTime, checkEndTime, checkEndTime, checkStartTime, checkEndTime]);
                    
                    bookedNames = new Set(bookedInCategory.map(r => r.resource_name));
                } catch (dbError) {
                    console.log(`Database not available for ${category}, assuming all available`);
                }

                const availableCount = resources.filter(r => !bookedNames.has(r.name)).length;
                const totalCount = resources.length;
                
                summary[category] = {
                    total: totalCount,
                    available: availableCount,
                    booked: totalCount - availableCount,
                    availability_percentage: Math.round((availableCount / totalCount) * 100),
                    has_availability: availableCount > 0
                };
            } catch (categoryError) {
                console.error(`Error processing category ${category}:`, categoryError);
                // Fallback: assume all available
                summary[category] = {
                    total: resources.length,
                    available: resources.length,
                    booked: 0,
                    availability_percentage: 100,
                    has_availability: true
                };
            }
        }
        
        console.log(`✅ Availability summary generated:`, summary);
        res.json(summary);
        
    } catch (error) {
        console.error('❌ Error getting availability summary:', error);
        
        // Fallback response
        const fallbackSummary = {};
        for (const [category, resources] of Object.entries(hardcodedResources)) {
            fallbackSummary[category] = {
                total: resources.length,
                available: resources.length,
                booked: 0,
                availability_percentage: 100,
                has_availability: true
            };
        }
        
        res.json(fallbackSummary);
    }
});

function generateAvailableSlots(bookings) {
    const slots = [];
    const dayStart = '08:00';
    const dayEnd = '22:00';
    
    // Convert times to minutes for easier calculation
    const timeToMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };
    
    const minutesToTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };
    
    const startMinutes = timeToMinutes(dayStart);
    const endMinutes = timeToMinutes(dayEnd);
    
    // Sort bookings by start time
    const sortedBookings = bookings.sort((a, b) => 
        timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
    );
    
    let currentTime = startMinutes;
    
    for (const booking of sortedBookings) {
        const bookingStart = timeToMinutes(booking.start_time);
        const bookingEnd = timeToMinutes(booking.end_time);
        
        // Add available slot before this booking
        if (currentTime < bookingStart) {
            slots.push({
                start: minutesToTime(currentTime),
                end: minutesToTime(bookingStart),
                duration: bookingStart - currentTime
            });
        }
        
        currentTime = Math.max(currentTime, bookingEnd);
    }
    
    // Add final slot if there's time left
    if (currentTime < endMinutes) {
        slots.push({
            start: minutesToTime(currentTime),
            end: minutesToTime(endMinutes),
            duration: endMinutes - currentTime
        });
    }
    
    return slots.filter(slot => slot.duration >= 60); // Only slots of 1 hour or more
}

// Create reservation
app.post('/api/reservations', async (req, res) => {
  try {
    const { 
      userId, 
      resourceType, 
      resourceName, 
      date, 
      startTime, 
      endTime,
      purpose = 'General Use',
      peopleCount = 1,
      specialRequests = ''
    } = req.body;
    
    // DEBUG: Log what we receive
    console.log('🔍 SERVER DEBUG - Received date:', date);
    console.log('🔍 SERVER DEBUG - Date type:', typeof date);
    console.log('🔍 SERVER DEBUG - Times:', { startTime, endTime });
    
    // Validate required fields
    if (!userId || !resourceType || !resourceName || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate time format
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:MM' });
    }
    
    // Business hours validation - 8:00 AM to 8:00 PM
    if (startTime < '08:00' || endTime > '20:00') {
      return res.status(400).json({ 
        error: 'Reservation times must be between 8:00 AM and 8:00 PM' 
      });
    }
    
    // Time order validation
    if (startTime >= endTime) {
      return res.status(400).json({ 
        error: 'End time must be after start time' 
      });
    }
    
    // Duration validation - Minimum 30 minutes, Maximum 4 hours
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMinutes = (end - start) / (1000 * 60);
    
    if (diffMinutes < 30) {
      return res.status(400).json({ 
        error: 'Reservation must be at least 30 minutes long' 
      });
    }
    
    if (diffMinutes > 480) { // 8 hours = 480 minutes
      return res.status(400).json({ 
        error: 'Reservation cannot be longer than 8 hours' 
      });
    }
    
    // Handle date validation without timezone conversion
    let reservationDateString = date;
    
    // Ensure date is in YYYY-MM-DD format
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      reservationDateString = date; // Use as-is
    } else {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // Get today in YYYY-MM-DD format
    const currentTime = now.toTimeString().slice(0, 5);

    console.log('🔍 SERVER DEBUG - Today string:', today);
    console.log('🔍 SERVER DEBUG - Reservation date string:', reservationDateString);
    
    // 🔧 PAST DATE VALIDATION
    if (reservationDateString < today) {
      return res.status(400).json({ 
        error: 'Cannot create reservations for past dates' 
      });
    }
    
    // 🔧 PAST TIME VALIDATION (for today's reservations)
    if (reservationDateString === today) {
      if (startTime <= currentTime) {
        return res.status(400).json({
          error: 'Cannot create reservations for past times',
          details: `Selected time ${startTime} has already passed. Current time is ${currentTime}`
        });
      }
    }
    
    // Check for conflicts - use the string date directly
    const [conflicts] = await dbAsync.query(
      `SELECT id FROM reservations 
       WHERE resource_name = ? 
       AND date = ? 
       AND status = 'active'
       AND ((start_time <= ? AND end_time > ?) 
       OR (start_time < ? AND end_time >= ?)
       OR (start_time >= ? AND end_time <= ?))`,
      [resourceName, reservationDateString, startTime, startTime, endTime, endTime, startTime, endTime]
    );
    
    if (conflicts.length > 0) {
      return res.status(400).json({ 
        error: 'Time slot already booked',
        details: 'Another reservation conflicts with your selected time'
      });
    }
    
    // 🔧 VALIDATE PEOPLE COUNT
    if (peopleCount < 1 || peopleCount > 50) {
      return res.status(400).json({ 
        error: 'People count must be between 1 and 50' 
      });
    }
    
    // Generate QR code for the reservation
    const qrCode = `RES-${Date.now()}-${userId}`;
    
    // Check if the new columns exist in the reservations table
    const [columns] = await dbAsync.query("SHOW COLUMNS FROM reservations LIKE 'purpose'");
    const hasNewColumns = columns.length > 0;
    
    let query, params;
    
    if (hasNewColumns) {
      // Use new enhanced reservation fields - save the date string directly
      query = `INSERT INTO reservations 
               (user_id, resource_type, resource_name, date, start_time, end_time, 
                purpose, people_count, special_requests, qr_code) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      params = [userId, resourceType, resourceName, reservationDateString, startTime, endTime, 
                purpose, peopleCount, specialRequests, qrCode];
    } else {
      // Fallback to original fields
      query = `INSERT INTO reservations 
               (user_id, resource_type, resource_name, date, start_time, end_time) 
               VALUES (?, ?, ?, ?, ?, ?)`;
      params = [userId, resourceType, resourceName, reservationDateString, startTime, endTime];
    }
    
    console.log('🔍 SERVER DEBUG - Query params:', params);
    const [result] = await dbAsync.query(query, params);
    
    // Log the reservation action
    await dbAsync.query(
      'INSERT INTO access_logs (user_id, action, resource_type, resource_id, success) VALUES (?, ?, ?, ?, ?)',
      [userId, 'reservation_created', resourceType, result.insertId, true]
    );
    
    console.log('✅ SERVER DEBUG - Reservation created successfully:', result.insertId);
    
    res.json({ 
      success: true, 
      reservationId: result.insertId,
      qrCode: qrCode,
      message: 'Reservation created successfully',
      details: {
        resourceName,
        date: reservationDateString,
        startTime,
        endTime,
        duration: `${diffMinutes} minutes`
      }
    });
  } catch (error) {
    console.error('❌ Reservation creation error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Internal server error during reservation creation'
    });
  }
});

// Cancel reservation
app.put('/api/reservations/:reservationId/cancel', async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { userId } = req.body;
    
    // Verify the reservation belongs to the user
    const [reservation] = await dbAsync.query(
      'SELECT * FROM reservations WHERE id = ? AND user_id = ?',
      [reservationId, userId]
    );
    
    if (reservation.length === 0) {
      return res.status(404).json({ error: 'Reservation not found or access denied' });
    }
    
    // Update status to cancelled
    await dbAsync.query(
      'UPDATE reservations SET status = "Cancelled" WHERE id = ?',
      [reservationId]
    );
    
    // Log the cancellation
    await dbAsync.query(
      'INSERT INTO access_logs (user_id, action, resource_type, resource_id, success) VALUES (?, ?, ?, ?, ?)',
      [userId, 'reservation_cancelled', reservation[0].resource_type, reservationId, true]
    );
    
    res.json({ success: true, message: 'Reservation cancelled successfully' });
  } catch (error) {
    console.error('Reservation cancellation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's reservations
// Replace the GET reservations endpoint in server.js with this:
app.get('/api/reservations/:userId', async (req, res) => {
  try {
    // Check if enhanced columns exist
    const [columns] = await dbAsync.query("SHOW COLUMNS FROM reservations LIKE 'purpose'");
    const hasNewColumns = columns.length > 0;
    
    let query;
    if (hasNewColumns) {
      // FIX: Use DATE_FORMAT to ensure date stays as YYYY-MM-DD string
      query = `SELECT id, user_id, resource_type, resource_name, 
                      DATE_FORMAT(date, '%Y-%m-%d') as date, 
                      start_time, end_time, 
                      status, purpose, people_count, special_requests, qr_code, 
                      check_in_time, check_out_time, created_at, updated_at
               FROM reservations 
               WHERE user_id = ? AND status = 'active' 
               ORDER BY date, start_time`;
    } else {
      // FIX: Use DATE_FORMAT for fallback query too
      query = `SELECT id, user_id, resource_type, resource_name,
                      DATE_FORMAT(date, '%Y-%m-%d') as date,
                      start_time, end_time, status, created_at, updated_at
               FROM reservations 
               WHERE user_id = ? AND status = 'active' 
               ORDER BY date, start_time`;
    }
    
    console.log('🔍 GET DEBUG - Fetching reservations for user:', req.params.userId);
    
    const [reservations] = await dbAsync.query(query, [req.params.userId]);
    
    // DEBUG: Log what we're sending back
    console.log('🔍 GET DEBUG - Number of reservations found:', reservations.length);
    reservations.forEach((reservation, index) => {
      console.log(`🔍 GET DEBUG - Reservation ${index + 1}:`, {
        id: reservation.id,
        name: reservation.resource_name,
        date: reservation.date,
        date_type: typeof reservation.date,
        start_time: reservation.start_time
      });
    });
    
    res.json(reservations);
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Log access - POST endpoint
app.post('/api/access-log', async (req, res) => {
  try {
    const { userId, action, resourceType, resourceId, success } = req.body;
    
    if (!action) {
      return res.status(400).json({ error: 'action is required' });
    }

    // Handle 'unknown' userId - convert to null for database
    let validUserId = userId;
    if (userId === 'unknown' || userId === 'null' || !userId) {
      validUserId = null;
    } else if (typeof userId === 'string' && !isNaN(userId)) {
      validUserId = parseInt(userId);
    }

    const [result] = await dbAsync.query(
      'INSERT INTO access_logs (user_id, action, resource_type, resource_id, success) VALUES (?, ?, ?, ?, ?)',
      [validUserId, action, resourceType || null, resourceId || null, success !== false]
    );
    
    res.json({ success: true, logId: result.insertId });
  } catch (error) {
    console.error('Access log error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get access logs
app.get('/api/access-logs', async (req, res) => {
  try {
    const [logs] = await dbAsync.query(`
      SELECT 
        al.*,
        u.name as user_name,
        u.email as user_email,
        u.student_id
      FROM access_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.timestamp DESC
      LIMIT 100
    `);
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get reservation stats
    const [reservationStats] = await dbAsync.query(`
      SELECT 
        COUNT(*) as total_reservations,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_reservations,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_reservations,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_reservations,
        COUNT(CASE WHEN date >= CURDATE() THEN 1 END) as upcoming_reservations
      FROM reservations 
      WHERE user_id = ?
    `, [userId]);

    // Get favorite resources count (if table exists)
    let favoritesStats = [{ favorites_count: 0 }];
    try {
      const [favorites] = await dbAsync.query(
        'SELECT COUNT(*) as favorites_count FROM user_favorites WHERE user_id = ?',
        [userId]
      );
      favoritesStats = favorites;
    } catch (e) {
      console.log('user_favorites table does not exist yet');
    }

    // Get access logs count (if table exists)
    let accessStats = [{ total_access_logs: 0 }];
    try {
      const [access] = await dbAsync.query(
        'SELECT COUNT(*) as total_access_logs FROM access_logs WHERE user_id = ?',
        [userId]
      );
      accessStats = access;
    } catch (e) {
      console.log('access_logs table does not exist yet');
    }

    // Get most used resource types (if reservations exist)
    let resourceTypes = [];
    try {
      const [resources] = await dbAsync.query(`
        SELECT resource_type, COUNT(*) as usage_count
        FROM reservations 
        WHERE user_id = ? AND status = 'completed'
        GROUP BY resource_type 
        ORDER BY usage_count DESC 
        LIMIT 3
      `, [userId]);
      resourceTypes = resources;
    } catch (e) {
      console.log('No completed reservations found');
    }

    res.json({
      reservations: reservationStats[0],
      favorites: favoritesStats[0],
      access_logs: accessStats[0],
      most_used_resources: resourceTypes
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Admin dashboard stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    // Get total users
    const [[{ totalUsers }]] = await dbAsync.query(
      'SELECT COUNT(*) as totalUsers FROM users'
    );
    
    // Get today's logins
    const [[{ todayLogins }]] = await dbAsync.query(
      `SELECT COUNT(*) as todayLogins 
       FROM access_logs 
       WHERE DATE(timestamp) = CURDATE() 
       AND action = 'login'`
    );
    
    // Get active reservations
    const [[{ activeReservations }]] = await dbAsync.query(
      `SELECT COUNT(*) as activeReservations 
       FROM reservations 
       WHERE date >= CURDATE() 
       AND status = 'active'`
    );
    
    res.json({
      totalUsers,
      todayLogins,
      activeReservations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
app.get('/api/users/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`👤 Loading profile for user ID: ${userId}`);

    const [users] = await dbAsync.query(
      `SELECT id, name, email, student_id, department, phone, 
              notification_preferences, profile_image_url, last_login, 
              registered_at, updated_at 
       FROM users WHERE id = ? AND deletion_info IS NULL`, 
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    
    // Parse notification preferences if it's a string
    if (typeof user.notification_preferences === 'string') {
      try {
        user.notification_preferences = JSON.parse(user.notification_preferences);
      } catch (e) {
        console.warn('Failed to parse notification_preferences for user', userId);
        user.notification_preferences = { email: true, browser: true, reminder_time: 30 };
      }
    }
    console.log(`✅ Profile loaded for user: ${user.name}`);

    res.json(user);
  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to load profile',
      details: error.message 
    });
  }
});

// Update user profile
app.put('/api/users/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, department, phone, notification_preferences } = req.body;
    
    console.log(`📝 Updating profile for user ${userId}:`, { name, email, department, phone });
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if email is already used by another user
    const [existingUsers] = await dbAsync.query(
      'SELECT id FROM users WHERE email = ? AND id != ? AND deletion_info IS NULL',
      [email, userId]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email is already in use by another account' });
    }

    await dbAsync.query(`
      UPDATE users 
      SET name = ?, email = ?, department = ?, phone = ?, 
          notification_preferences = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deletion_info IS NULL
    `, [
        name.trim(),
        email.trim().toLowerCase(),
        department?.trim() || null,
        phone?.trim() || null,
        JSON.stringify(notification_preferences || { email: true, browser: true, reminder_time: 30 }),
        userId
    ]);

    // Fetch updated user data
    const [updatedUsers] = await dbAsync.query(`
      SELECT id, name, email, student_id, department, phone, 
             notification_preferences, registered_at, last_login
      FROM users 
      WHERE id = ?
    `, [userId]);

    const updatedUser = updatedUsers[0];
    if (typeof updatedUser.notification_preferences === 'string') {
      updatedUser.notification_preferences = JSON.parse(updatedUser.notification_preferences);
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Check-in to reservation 
app.post('/api/reservations/:reservationId/checkin', async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { userId } = req.body;
    
    console.log('🔍 CHECK-IN DEBUG - Starting check-in for reservation:', reservationId);
    
    // Verify the reservation belongs to the user and is active
    const [reservation] = await dbAsync.query(
      `SELECT id, user_id, resource_type, resource_name,
              DATE_FORMAT(date, '%Y-%m-%d') as date,
              start_time, end_time, status, check_in_time, check_out_time
       FROM reservations 
       WHERE id = ? AND user_id = ? AND status = 'active'`,
      [reservationId, userId]
    );
    
    if (reservation.length === 0) {
      return res.status(404).json({ error: 'Reservation not found or access denied' });
    }
    
    const res_data = reservation[0];
    
    console.log('🔍 CHECK-IN DEBUG - Reservation data:', {
      id: res_data.id,
      date: res_data.date,
      date_type: typeof res_data.date,
      start_time: res_data.start_time,
      check_in_time: res_data.check_in_time
    });
    
    // FIX: Handle date parsing for string format (YYYY-MM-DD)
    const now = new Date();
    let reservationDateTime;
    
    try {
      // Since date is now a string like "2025-06-21", use it directly
      if (typeof res_data.date === 'string' && res_data.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Date is already in YYYY-MM-DD format
        reservationDateTime = new Date(`${res_data.date}T${res_data.start_time}`);
      } else {
        // Fallback: extract date part if it's still in ISO format
        const dateOnly = res_data.date.toString().split('T')[0];
        reservationDateTime = new Date(`${dateOnly}T${res_data.start_time}`);
      }
      
      console.log('🔍 CHECK-IN DEBUG - Date parsing:', {
        dateString: res_data.date,
        combinedDateTime: `${res_data.date}T${res_data.start_time}`,
        parsedDateTime: reservationDateTime,
        isValidDate: !isNaN(reservationDateTime.getTime())
      });
      
      if (isNaN(reservationDateTime.getTime())) {
        throw new Error('Invalid date parsing result');
      }
    } catch (error) {
      console.error('🔍 CHECK-IN ERROR - Date parsing failed:', error);
      console.error('🔍 CHECK-IN ERROR - Raw date data:', res_data.date);
      return res.status(500).json({ error: 'Invalid reservation date format in database' });
    }
    
    const checkInWindow = 15 * 60 * 1000; // 15 minutes in milliseconds
    const lateWindow = 30 * 60 * 1000; // 30 minutes in milliseconds
    
    const timeDiff = now.getTime() - reservationDateTime.getTime();
    
    console.log('🔍 CHECK-IN DEBUG - Time calculations:', {
      currentTime: now,
      reservationTime: reservationDateTime,
      timeDifferenceMs: timeDiff,
      timeDifferenceMin: Math.round(timeDiff / (60 * 1000)),
      checkInWindow: checkInWindow,
      lateWindow: lateWindow
    });
    
    if (timeDiff < -checkInWindow) {
      return res.status(400).json({ 
        error: 'Check-in not available yet. You can check in 15 minutes before your reservation.' 
      });
    }
    
    if (timeDiff > lateWindow) {
      return res.status(400).json({ 
        error: 'Check-in window has expired. Please contact support.' 
      });
    }
    
    // Check if already checked in
    if (res_data.check_in_time) {
      return res.status(400).json({ 
        error: 'Already checked in',
        checkInTime: res_data.check_in_time
      });
    }
    
    // Check if the new columns exist in the reservations table
    const [columns] = await dbAsync.query("SHOW COLUMNS FROM reservations LIKE 'check_in_time'");
    const hasNewColumns = columns.length > 0;
    
    if (hasNewColumns) {
      // Update check-in time
      await dbAsync.query(
        'UPDATE reservations SET check_in_time = CURRENT_TIMESTAMP WHERE id = ?',
        [reservationId]
      );
    }
    
    // Log the check-in
    await dbAsync.query(
      'INSERT INTO access_logs (user_id, action, resource_type, resource_id, success) VALUES (?, ?, ?, ?, ?)',
      [userId, 'checked_in', res_data.resource_type, reservationId, true]
    );
    
    console.log('🔍 CHECK-IN SUCCESS - User checked in successfully');
    
    res.json({ 
      success: true, 
      message: 'Successfully checked in',
      checkInTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('🔍 CHECK-IN ERROR - General error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check-out from reservation
app.post('/api/reservations/:reservationId/checkout', async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { userId } = req.body;
    
    // Verify the reservation belongs to the user
    const [reservation] = await dbAsync.query(
      `SELECT * FROM reservations 
       WHERE id = ? AND user_id = ? AND status = 'active'`,
      [reservationId, userId]
    );
    
    if (reservation.length === 0) {
      return res.status(404).json({ error: 'Reservation not found or access denied' });
    }
    
    const res_data = reservation[0];
    
    // Check if checked in
    if (!res_data.check_in_time) {
      return res.status(400).json({ error: 'Must check in before checking out' });
    }
    
    // Check if already checked out
    if (res_data.check_out_time) {
      return res.status(400).json({ 
        error: 'Already checked out',
        checkOutTime: res_data.check_out_time
      });
    }
    
    // Check if the new columns exist in the reservations table
    const [columns] = await dbAsync.query("SHOW COLUMNS FROM reservations LIKE 'check_out_time'");
    const hasNewColumns = columns.length > 0;
    
    if (hasNewColumns) {
      // Update check-out time
      await dbAsync.query(
        'UPDATE reservations SET check_out_time = CURRENT_TIMESTAMP WHERE id = ?',
        [reservationId]
      );
    }
    
    // Log the check-out
    await dbAsync.query(
      'INSERT INTO access_logs (user_id, action, resource_type, resource_id, success) VALUES (?, ?, ?, ?, ?)',
      [userId, 'checked_out', res_data.resource_type, reservationId, true]
    );
    
    res.json({ 
      success: true, 
      message: 'Successfully checked out',
      checkOutTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update last login time
app.post('/api/users/:userId/login', async (req, res) => {
  try {
    await dbAsync.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [req.params.userId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Login update error:', error);
    res.status(500).json({ error: error.message });
  }
});

function safeJsonParse(value, defaultValue = {}) {
    if (!value) return defaultValue;
    
    // If it's already an object, return it
    if (typeof value === 'object') return value;
    
    // If it's a string, try to parse it
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch (error) {
            console.warn('Failed to parse JSON:', value, error.message);
            return defaultValue;
        }
    }
    
    return defaultValue;
}

// 1. Get all building with basic info
app.get('/api/buildings', async(req, res) => {
    try {
        const { type } = req.query;
        
        // Try to get buildings from database first
        let buildings = [];
        try {
            const [dbBuildings] = await dbAsync.query(`
                SELECT
                    id, name, code, address, latitude, longitude, 
                    building_type, floors, capacity, description,
                    amenities, opening_hours, contact_info, 
                    accessibility_features, image_urls, is_active
                FROM buildings 
                WHERE is_active = TRUE
                ORDER BY name
            `);
            
            console.log(`Found ${dbBuildings.length} buildings in database`);
            
            // Parse JSON fields safely
            buildings = dbBuildings.map(building => {
                try {
                    console.log(`Processing building ${building.id}: ${building.name}`);
                    
                    return {
                        ...building,
                        amenities: safeJsonParse(building.amenities, {}),
                        opening_hours: safeJsonParse(building.opening_hours, {}),
                        contact_info: safeJsonParse(building.contact_info, {}),
                        accessibility_features: safeJsonParse(building.accessibility_features, {}),
                        image_urls: safeJsonParse(building.image_urls, []),
                        resourceCount: Object.values(hardcodedResources)
                            .flat()
                            .filter(resource => resource.building === building.code).length
                    };
                } catch (error) {
                    console.error(`Error processing building ${building.id}:`, error);
                    return {
                        ...building,
                        amenities: {},
                        opening_hours: {},
                        contact_info: {},
                        accessibility_features: {},
                        image_urls: [],
                        resourceCount: 0
                    };
                }
            });
        } catch (dbError) {
            console.log('Database not available, using hardcoded buildings');
            
            // Fallback to hardcoded buildings
            const hardcodedBuildings = [
                { id: 1, name: 'Clădirea Centrala UTCN', code: 'MAIN', type: 'academic', address: 'Str. Constantin Daicoviciu nr. 15, Cluj-Napoca', capacity: 500, floors: 4 },
                { id: 2, name: 'Facultatea de Automatică și Calculatoare', code: 'AC', type: 'academic', address: 'Str. Memorandumului nr. 28, Cluj-Napoca', capacity: 800, floors: 5 },
                { id: 3, name: 'Facultatea de Inginerie Electrică', code: 'IE', type: 'academic', address: 'Str. Croitorilor nr. 2, Cluj-Napoca', capacity: 600, floors: 4 },
                { id: 4, name: 'Centrul de Cercetare și Inovare', code: 'RES', type: 'research', address: 'Str. Republicii nr. 37, Cluj-Napoca', capacity: 200, floors: 3 },
                { id: 5, name: 'Biblioteca Centrală Universitară', code: 'LIB', type: 'library', address: 'Str. Clinicilor nr. 2, Cluj-Napoca', capacity: 1000, floors: 6 },
                { id: 6, name: 'Facultatea de Construcții', code: 'FC', type: 'academic', address: 'Str. Constantin Daicoviciu nr. 15, Cluj-Napoca', capacity: 700, floors: 4 },
                { id: 7, name: 'Facultatea de Mecanică', code: 'FM', type: 'academic', address: 'Bd. Muncii nr. 103-105, Cluj-Napoca', capacity: 900, floors: 5 },
                { id: 8, name: 'Rectoratul UTCN', code: 'RECTORAT', type: 'administrative', address: 'Str. Constantin Daicoviciu nr. 15, Cluj-Napoca', capacity: 150, floors: 3 },
                { id: 9, name: 'Căminul Studențesc Tudor Vladimirescu', code: 'CAM1', type: 'residential', address: 'Str. Tudor Vladimirescu nr. 23, Cluj-Napoca', capacity: 800, floors: 10 },
                { id: 10, name: 'Complexul Sportiv UTCN', code: 'SPORT', type: 'recreational', address: 'Str. Constantin Daicoviciu nr. 15, Cluj-Napoca', capacity: 300, floors: 2 },
                { id: 11, name: 'Centrul Medical Universitar', code: 'MEDICAL', type: 'medical', address: 'Str. Clinicilor nr. 2, Cluj-Napoca', capacity: 100, floors: 2 }
            ];
            
            buildings = hardcodedBuildings.map(building => ({
                ...building,
                building_type: building.type,
                latitude: 46.7712 + (Math.random() - 0.5) * 0.01, // Add some variation
                longitude: 23.6236 + (Math.random() - 0.5) * 0.01,
                description: `${building.name} - parte din campusul UTCN`,
                amenities: { wifi: true, parking: true },
                opening_hours: { weekdays: '07:00-21:00', saturday: '08:00-16:00' },
                contact_info: { phone: '+40 264 401200' },
                accessibility_features: { wheelchair_access: true },
                image_urls: [],
                is_active: true,
                resourceCount: Object.values(hardcodedResources)
                    .flat()
                    .filter(resource => resource.building === building.code).length
            }));
        }
        
        // Filter by type if specified
        if (type && type !== 'all') {
            buildings = buildings.filter(building => building.building_type === type);
        }
        
        console.log(`Successfully processed ${buildings.length} buildings`);
        res.json(buildings);
    } catch (error) {
        console.error('Error fetching buildings:', error);
        res.status(500).json({ error: error.message });    
    }
});

// 2. Get specific building details with transport and parking
app.get('/api/buildings/:buildingCode', async (req, res) => {
    try {
        const { buildingCode } = req.params;
    
        // Get building details
        const [buildings] = await dbAsync.query(`
            SELECT * FROM buildings WHERE code = ? AND is_active = TRUE
        `, [buildingCode]);
    
        if (buildings.length === 0) {
            return res.status(404).json({ error: 'Building not found' });
        }
        const building = buildings[0];
        const buildingId = building.id;
    
        // Get transport access
        const [transportAccess] = await dbAsync.query(`
            SELECT 
                ts.name as stop_name,
                ts.latitude as stop_latitude,
                ts.longitude as stop_longitude,
                ts.stop_type,
                ts.accessibility_features as stop_accessibility,
                ts.facilities as stop_facilities,
                bta.walking_distance_meters,
                bta.walking_time_minutes,
                bta.accessibility_route,
                bta.route_description,
                GROUP_CONCAT(
                    CONCAT(tr.route_number, '|', tr.route_name, '|', tr.transport_type, '|', tr.route_color, '|', 
                        rs.peak_frequency_minutes, '|', rs.off_peak_frequency_minutes, '|', 
                        rs.first_departure, '|', rs.last_departure)
                    SEPARATOR ';;'
                ) as routes
            FROM building_transport_access bta
            JOIN transport_stops ts ON bta.transport_stop_id = ts.id
            LEFT JOIN route_stops rs ON ts.id = rs.stop_id
            LEFT JOIN transport_routes tr ON rs.route_id = tr.id AND tr.is_active = TRUE
            WHERE bta.building_id = ? AND ts.is_active = TRUE
            GROUP BY ts.id, bta.id
            ORDER BY bta.walking_time_minutes
        `, [buildingId]);
    
        // Get nearby parking
        const [parking] = await dbAsync.query(`
            SELECT 
                pa.*,
                CASE 
                    WHEN pa.building_id = ? THEN 0
                    ELSE ROUND(
                        6371 * acos(
                            cos(radians(?)) * cos(radians(pa.latitude)) * 
                            cos(radians(pa.longitude) - radians(?)) + 
                            sin(radians(?)) * sin(radians(pa.latitude))
                        ) * 1000
                    )
                END as distance_meters
            FROM parking_areas pa
            WHERE pa.is_active = TRUE
            AND (
                pa.building_id = ?
                OR (
                    6371 * acos(
                        cos(radians(?)) * cos(radians(pa.latitude)) * 
                        cos(radians(pa.longitude) - radians(?)) + 
                        sin(radians(?)) * sin(radians(pa.latitude))
                    ) * 1000 <= 1000
                )
            )
            ORDER BY distance_meters
        `, [buildingId, building.latitude, building.longitude, building.latitude, 
            buildingId, building.latitude, building.longitude, building.latitude]);
    
        // Format transport data safely
        const formattedTransport = transportAccess.map(access => ({
            stop_name: access.stop_name,
            location: {
                latitude: access.stop_latitude,
                longitude: access.stop_longitude
            },
            stop_type: access.stop_type,
            accessibility: safeJsonParse(access.stop_accessibility, {}),
            facilities: safeJsonParse(access.stop_facilities, {}),
            distance: {
                meters: access.walking_distance_meters,
                walking_time_minutes: access.walking_time_minutes
            },
            accessibility_route: access.accessibility_route,
            route_description: access.route_description,
            routes: access.routes ? access.routes.split(';;').map(routeStr => {
                const [route_number, route_name, transport_type, route_color, 
                       peak_freq, off_peak_freq, first_dep, last_dep] = routeStr.split('|');
                return {
                    route_number,
                    route_name,
                    transport_type,
                    route_color,
                    frequency: {
                        peak_minutes: parseInt(peak_freq) || null,
                        off_peak_minutes: parseInt(off_peak_freq) || null
                    },
                    schedule: {
                        first_departure: first_dep,
                        last_departure: last_dep
                    }
                };
            }) : []
        }));
    
        // Format parking data safely
        const formattedParking = parking.map(p => ({
            id: p.id,
            name: p.name,
            location: {
                latitude: p.latitude,
                longitude: p.longitude
            },
            capacity: {
                total_spaces: p.total_spaces,
                available_spaces: p.available_spaces,
                accessibility_spaces: p.accessibility_spaces,
                ev_charging_stations: p.ev_charging_stations
            },
            pricing: {
                type: p.parking_type,
                hourly_rate: p.hourly_rate,
                daily_rate: p.daily_rate,
                monthly_rate: p.monthly_rate
            },
            features: {
                security: safeJsonParse(p.security_features, {}),
                operating_hours: safeJsonParse(p.operating_hours, {}),
                payment_methods: safeJsonParse(p.payment_methods, []),
                restrictions: p.restrictions
            },
            distance_meters: p.distance_meters
        }));
    
        // Format building data safely
        const formattedBuilding = {
            ...building,
            amenities: safeJsonParse(building.amenities, {}),
            opening_hours: safeJsonParse(building.opening_hours, {}),
            contact_info: safeJsonParse(building.contact_info, {}),
            accessibility_features: safeJsonParse(building.accessibility_features, {}),
            emergency_info: safeJsonParse(building.emergency_info, {}),
            image_urls: safeJsonParse(building.image_urls, []),
            transport_access: formattedTransport,
            nearby_parking: formattedParking
        };
    
        res.json(formattedBuilding);
    } catch (error) {
        console.error('Error fetching building details:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Get transport information for a specific building or location
app.get('/api/transport/:buildingCode', async (req, res) => {
    try {
        const { buildingCode } = req.params;
        const { includeRealTime = false } = req.query;
    
        // Get building
        const [buildings] = await dbAsync.query(`
            SELECT id, name, latitude, longitude FROM buildings 
            WHERE code = ? AND is_active = TRUE
        `, [buildingCode]);
    
        if (buildings.length === 0) {
            return res.status(404).json({ error: 'Building not found' });
        }
        const building = buildings[0];
    
        // Get all transport routes serving this building
        const [routes] = await dbAsync.query(`
            SELECT DISTINCT
                tr.id, tr.route_number, tr.route_name, tr.transport_type, 
                tr.operator, tr.route_color,
                ts.name as stop_name,
                ts.latitude as stop_latitude,
                ts.longitude as stop_longitude,
                bta.walking_time_minutes,
                rs.peak_frequency_minutes,
                rs.off_peak_frequency_minutes,
                rs.first_departure,
                rs.last_departure,
                ts.accessibility_features as stop_accessibility
            FROM building_transport_access bta
            JOIN transport_stops ts ON bta.transport_stop_id = ts.id
            JOIN route_stops rs ON ts.id = rs.stop_id
            JOIN transport_routes tr ON rs.route_id = tr.id
            WHERE bta.building_id = ? AND tr.is_active = TRUE AND ts.is_active = TRUE
            ORDER BY bta.walking_time_minutes, tr.route_number
        `, [building.id]);
    
        // Group by transport type
        const transportByType = routes.reduce((acc, route) => {
            if (!acc[route.transport_type]) {
                acc[route.transport_type] = [];
            }
        
            acc[route.transport_type].push({
                id: route.id,
                route_number: route.route_number,
                route_name: route.route_name,
                operator: route.operator,
                route_color: route.route_color,
                stop: {
                    name: route.stop_name,
                    location: {
                        latitude: route.stop_latitude,
                        longitude: route.stop_longitude
                    },
                    walking_time_minutes: route.walking_time_minutes,
                    accessibility: safeJsonParse(route.stop_accessibility, {})
                },
                schedule: {
                    peak_frequency_minutes: route.peak_frequency_minutes,
                    off_peak_frequency_minutes: route.off_peak_frequency_minutes,
                    first_departure: route.first_departure,
                    last_departure: route.last_departure
                }
            });
        return acc;
    }, {});
    
        // Get general transport info for Cluj-Napoca
        const transportInfo = {
            building: {
                name: building.name,
                code: buildingCode,
                location: {
                    latitude: building.latitude,
                    longitude: building.longitude
                }
            },
            available_transport: transportByType,
            general_info: {
                ticket_prices: {
                    single_ride: '2.5 RON',
                    daily_pass: '8 RON',
                    monthly_student: '50 RON',
                    monthly_regular: '100 RON'
                },
                mobile_apps: [
                    {
                        name: 'CTP Cluj-Napoca',
                        platforms: ['Android', 'iOS'],
                        features: ['Real-time tracking', 'Route planning', 'Ticket purchase']
                    },
                    {
                        name: 'Citymapper',
                        platforms: ['Android', 'iOS'],
                        features: ['Multi-modal planning', 'Real-time updates']
                    }
                ],
                accessibility: {
                    wheelchair_accessible_vehicles: true,
                    audio_announcements: true,
                    low_floor_buses: true,
                    tactile_paving: 'Available at major stops'
                }
            }
        };
    
        // Add real-time data if requested (placeholder for future API integration)
        if (includeRealTime === 'true') {
            transportInfo.real_time_note = 'Real-time data integration available via CTP Cluj API';
            transportInfo.api_endpoints = {
                live_arrivals: 'https://ctpcj.ro/api/arrivals',
                route_status: 'https://ctpcj.ro/api/routes'
            };
        }
    
        res.json(transportInfo);
    } catch (error) {
        console.error('Error fetching transport info:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. Get parking information for a building or area
app.get('/api/parking/:buildingCode', async (req, res) => {
    try {
        const { buildingCode } = req.params;
        const { radius = 1000 } = req.query; // Default 1km radius

        console.log(`🅿️ Loading parking info for building: ${buildingCode}`);
    
        // Get building
        const [buildings] = await dbAsync.query(`
            SELECT id, name, latitude, longitude FROM buildings 
            WHERE code = ? AND is_active = TRUE
        `, [buildingCode]);
    
        if (buildings.length === 0) {
            return res.status(404).json({ error: 'Building not found' });
        }
        const building = buildings[0];
    
        // Get parking areas within radius
        const [parkingAreas] = await dbAsync.query(`
            SELECT 
                pa.*,
                b.name as associated_building_name,
                ROUND(
                    6371 * acos(
                        cos(radians(?)) * cos(radians(pa.latitude)) * 
                        cos(radians(pa.longitude) - radians(?)) + 
                        sin(radians(?)) * sin(radians(pa.latitude))
                    ) * 1000
                ) as distance_meters,
                ROUND(
                    6371 * acos(
                        cos(radians(?)) * cos(radians(pa.latitude)) * 
                        cos(radians(pa.longitude) - radians(?)) + 
                        sin(radians(?)) * sin(radians(pa.latitude))
                    ) * 1000 / 80
                ) as walking_time_minutes
            FROM parking_areas pa
            LEFT JOIN buildings b ON pa.building_id = b.id
            WHERE pa.is_active = TRUE
            HAVING distance_meters <= ?
            ORDER BY distance_meters
        `, [
            building.latitude, building.longitude, building.latitude,
            building.latitude, building.longitude, building.latitude,
            radius
        ]);
        console.log(`🅿️ Found ${parkingAreas.length} parking areas for ${buildingCode}`);
        // Format parking data
        const formattedParking = parkingAreas.map(parking => {
            try {
                console.log(`🅿️ Processing parking area: ${parking.name}`);
                
                return {
                    id: parking.id,
                    name: parking.name,
                    associated_building: parking.associated_building_name,
                    location: {
                        latitude: parking.latitude,
                        longitude: parking.longitude,
                        address: `Parking near ${parking.name}`
                    },
                    capacity: {
                        total_spaces: parking.total_spaces,
                        available_spaces: parking.available_spaces,
                        accessibility_spaces: parking.accessibility_spaces,
                        ev_charging_stations: parking.ev_charging_stations
                    },
                    pricing: {
                        type: parking.parking_type,
                        hourly_rate: parking.hourly_rate,
                        daily_rate: parking.daily_rate,
                        monthly_rate: parking.monthly_rate,
                        currency: 'RON'
                    },
                    access: {
                        operating_hours: safeJsonParse(parking.operating_hours, {}),
                        payment_methods: safeJsonParse(parking.payment_methods, []),
                        restrictions: parking.restrictions
                    },
                    features: {
                        security: safeJsonParse(parking.security_features, {}),
                        accessibility_compliant: parking.accessibility_spaces > 0,
                        ev_charging_available: parking.ev_charging_stations > 0
                    },
                    distance: {
                        meters: parking.distance_meters,
                        walking_time_minutes: parking.walking_time_minutes
                    },
                    last_updated: parking.last_updated
                };
            } catch (error) {
                console.error(`❌ Error processing parking area ${parking.id}:`, error);
                // Return parking with default values for problematic fields
                return {
                    id: parking.id,
                    name: parking.name || 'Unknown Parking',
                    associated_building: parking.associated_building_name,
                    location: {
                        latitude: parking.latitude,
                        longitude: parking.longitude,
                        address: `Parking near ${parking.name || 'Unknown'}`
                    },
                    capacity: {
                        total_spaces: parking.total_spaces || 0,
                        available_spaces: parking.available_spaces || 0,
                        accessibility_spaces: parking.accessibility_spaces || 0,
                        ev_charging_stations: parking.ev_charging_stations || 0
                    },
                    pricing: {
                        type: parking.parking_type || 'unknown',
                        hourly_rate: parking.hourly_rate || 0,
                        daily_rate: parking.daily_rate || 0,
                        monthly_rate: parking.monthly_rate || 0,
                        currency: 'RON'
                    },
                    access: {
                        operating_hours: {},
                        payment_methods: [],
                        restrictions: parking.restrictions || null
                    },
                    features: {
                        security: {},
                        accessibility_compliant: (parking.accessibility_spaces || 0) > 0,
                        ev_charging_available: (parking.ev_charging_stations || 0) > 0
                    },
                    distance: {
                        meters: parking.distance_meters || 0,
                        walking_time_minutes: parking.walking_time_minutes || 0
                    },
                    last_updated: parking.last_updated
                };
            }
        });
        console.log(`✅ Successfully processed ${formattedParking.length} parking areas`);

        res.json({
            building: {
                name: building.name,
                code: buildingCode
            },
            search_radius_meters: parseInt(radius),
            parking_areas: formattedParking,
            summary: {
                total_areas_found: formattedParking.length,
                total_spaces: formattedParking.reduce((sum, p) => sum + (p.capacity.total_spaces || 0), 0),
                free_parking_available: formattedParking.some(p => p.pricing.type === 'free'),
                accessibility_parking_available: formattedParking.some(p => p.capacity.accessibility_spaces > 0),
                ev_charging_available: formattedParking.some(p => p.capacity.ev_charging_stations > 0)
            }
        });
    } catch (error) {
        console.error('Error fetching parking info:', error);
        res.status(500).json({
            error: error.message 
        });
    }
});

// Add this debug endpoint to your server.js to identify problematic JSON fields
app.get('/api/debug/json-fields', async (req, res) => {
    try {
        console.log('🔍 Debugging JSON fields in buildings table...');
        
        const [buildings] = await dbAsync.query(`
            SELECT id, name, code, amenities, opening_hours, contact_info, 
                   accessibility_features, image_urls
            FROM buildings 
            LIMIT 5
        `);
        
        const debugInfo = buildings.map(building => {
            const debug = {
                id: building.id,
                name: building.name,
                code: building.code,
                fields: {}
            };
            
            // Check each JSON field
            const jsonFields = ['amenities', 'opening_hours', 'contact_info', 'accessibility_features', 'image_urls'];
            
            jsonFields.forEach(field => {
                const value = building[field];
                debug.fields[field] = {
                    raw_value: value,
                    type: typeof value,
                    is_null: value === null,
                    is_string: typeof value === 'string',
                    is_object: typeof value === 'object',
                    length: value ? value.length : 0,
                    starts_with: typeof value === 'string' ? value.substring(0, 10) : null,
                    can_parse: false,
                    parse_error: null
                };
                
                // Try to parse if it's a string
                if (typeof value === 'string' && value) {
                    try {
                        JSON.parse(value);
                        debug.fields[field].can_parse = true;
                    } catch (error) {
                        debug.fields[field].parse_error = error.message;
                    }
                }
            });
            
            return debug;
        });
        
        res.json({
            total_buildings_checked: buildings.length,
            debug_info: debugInfo,
            recommendations: [
                'Fields with type "object" are already parsed - do not use JSON.parse()',
                'Fields with type "string" that can_parse=true are JSON strings - safe to parse',
                'Fields with parse_error need to be cleaned in database',
                'Use the safeJsonParse() helper function for all JSON fields'
            ]
        });
        
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack 
        });
    }
});

// Also add this to check which buildings have problematic data
app.get('/api/debug/problematic-buildings', async (req, res) => {
    try {
        const [buildings] = await dbAsync.query(`
            SELECT id, name, code, amenities, opening_hours, contact_info, 
                   accessibility_features, image_urls
            FROM buildings
        `);
        
        const problematic = [];
        
        buildings.forEach(building => {
            const issues = [];
            const jsonFields = ['amenities', 'opening_hours', 'contact_info', 'accessibility_features', 'image_urls'];
            
            jsonFields.forEach(field => {
                const value = building[field];
                
                // Check if it's a string that's not valid JSON
                if (typeof value === 'string' && value.trim() !== '') {
                    try {
                        JSON.parse(value);
                    } catch (error) {
                        issues.push({
                            field: field,
                            error: 'Invalid JSON string',
                            value: value.substring(0, 50) + (value.length > 50 ? '...' : ''),
                            message: error.message
                        });
                    }
                }
                
                // Check if it's an object (which means it's already parsed)
                if (typeof value === 'object' && value !== null) {
                    issues.push({
                        field: field,
                        error: 'Already parsed object',
                        message: 'This field is already a JavaScript object, do not use JSON.parse()'
                    });
                }
            });
            
            if (issues.length > 0) {
                problematic.push({
                    building: {
                        id: building.id,
                        name: building.name,
                        code: building.code
                    },
                    issues: issues
                });
            }
        });
        
        res.json({
            total_buildings: buildings.length,
            problematic_count: problematic.length,
            problematic_buildings: problematic,
            fix_suggestion: problematic.length > 0 ? 
                'Use safeJsonParse() function instead of JSON.parse() to handle these cases' : 
                'No issues found - safe to use regular JSON.parse()'
        });
        
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:userId/account', async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    console.log(`🗑️ Account deletion request for user ID: ${userId}`);

    // Verify user exists and is not already deleted
    const [users] = await dbAsync.query(
      'SELECT * FROM users WHERE id = ? AND deletion_info IS NULL',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found or already deleted' });
    }

    const user = users[0];
    console.log(`👤 Found user: ${user.name} (${user.email})`);

    // Start transaction for data consistency
    await dbAsync.query('START TRANSACTION');

    try {
      // 1. Get all active/future reservations
      const [activeReservations] = await dbAsync.query(`
        SELECT id, resource_name, resource_type, date, start_time, end_time, status
        FROM reservations 
        WHERE user_id = ? 
        AND (status = 'active' OR status = 'pending' OR (date >= CURDATE()))
        ORDER BY date, start_time
      `, [userId]);

      console.log(`📅 Found ${activeReservations.length} reservations to cancel`);

      // 2. Cancel all active/future reservations
      if (activeReservations.length > 0) {
        await dbAsync.query(`
          UPDATE reservations 
          SET status = 'Cancelled_AccDeleted', 
              updated_at = CURRENT_TIMESTAMP 
          WHERE user_id = ? 
          AND (status = 'active' OR status = 'pending' OR (date >= CURDATE()))
        `, [userId]);
      }

      // 3. Soft delete - update user record to mark as deleted
      const deletionData = {
        deleted_at: new Date().toISOString(),
        deletion_reason: reason || 'User requested account deletion',
        original_email: user.email,
        original_name: user.name,
        reservations_cancelled: activeReservations.length
      };

      await dbAsync.query(`
        UPDATE users 
        SET 
          email = CONCAT('deleted_', ?, '_', id),
          name = CONCAT('[DELETED] ', name),
          student_id = CONCAT('DELETED_', id),
          face_descriptor = NULL,
          face_descriptor_encrypted = NULL,
          encryption_iv = NULL,
          phone = NULL,
          notification_preferences = '{"deleted": true}',
          profile_image_url = NULL,
          last_login = NULL,
          updated_at = CURRENT_TIMESTAMP,
          deletion_info = ?
        WHERE id = ?
      `, [
        Date.now(),
        JSON.stringify(deletionData), 
        userId
      ]);

      // 4. Delete user favorites (if table exists)
      try {
        await dbAsync.query('DELETE FROM user_favorites WHERE user_id = ?', [userId]);
      } catch (e) {
        console.log('user_favorites table does not exist');
      }

      // Commit transaction
      await dbAsync.query('COMMIT');

      console.log(`✅ Account deletion completed for user ${user.name}`);

      res.json({
        success: true,
        message: 'Account deleted successfully',
        details: {
          reservations_cancelled: activeReservations.length,
          cancelled_reservations: activeReservations.map(r => ({
            resource: r.resource_name,
            date: r.date,
            time: `${r.start_time}-${r.end_time}`
          }))
        }
      });

    } catch (transactionError) {
      // Rollback transaction on error
      await dbAsync.query('ROLLBACK');
      throw transactionError;
    }

  } catch (error) {
    console.error('❌ Account deletion error:', error);
    res.status(500).json({ 
      error: 'Failed to delete account',
      details: error.message 
    });
  }
});

// Get account deletion impact (what will be deleted)
app.get('/api/users/:userId/deletion-impact', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user info
    const [users] = await dbAsync.query(
      'SELECT name, email, registered_at FROM users WHERE id = ? AND deletion_info IS NULL',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get active/future reservations
    const [reservations] = await dbAsync.query(`
      SELECT id, resource_name, resource_type, date, start_time, end_time, status
      FROM reservations 
      WHERE user_id = ? 
      AND (status = 'active' OR status = 'pending' OR (date >= CURDATE()))
      ORDER BY date, start_time
    `, [userId]);

    // Get user favorites count
    const [favorites] = await dbAsync.query(
      'SELECT COUNT(*) as count FROM user_favorites WHERE user_id = ?',
      [userId]
    );

    // Get access logs count
    const [accessLogs] = await dbAsync.query(
      'SELECT COUNT(*) as count FROM access_logs WHERE user_id = ?',
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
        favorites_count: favorites[0].count,
        access_logs_count: accessLogs[0].count
      }
    });
  } catch (error) {
    console.error('Error fetching deletion impact:', error);
    res.status(500).json({ error: 'Failed to fetch deletion impact' });
  }
});

const testYahooConnection = async () => {
  try {
    await emailTransporter.verify();
    console.log('✅ Yahoo Mail service is ready');
    console.log('📧 Configured email:', process.env.EMAIL_USER);
  } catch (error) {
    console.error('❌ Yahoo Mail configuration error:', error.message);
    console.log('🔧 Please check your Yahoo App Password setup');
    console.log('📖 Guide: https://help.yahoo.com/kb/generate-manage-third-party-passwords-sln15241.html');
  }
};
testYahooConnection();

// HTTP -> HTTPS
const PORT = process.env.PORT_BACKEND || process.env.PORT || 3001;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

if (USE_HTTPS) {
  try {
    console.log('🔐 Loading HTTPS certificates...');
    
    const httpsOptions = {
      key: readFileSync('./certs/key.pem'),
      cert: readFileSync('./certs/cert.pem')
    };

    https.createServer(httpsOptions, app).listen(PORT, () => {
      console.log(`🔒 HTTPS Server running on https://localhost:${PORT}`);
      console.log(`📱 Backend accessible from network: https://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('❌ HTTPS setup failed:', error.message);
    console.log('🔄 Falling back to HTTP...');
    
    app.listen(PORT, () => {
      console.log(`🌐 HTTP Server running on http://localhost:${PORT}`);
    });
  }
} else {
  app.listen(PORT, () => {
    console.log(`🌐 HTTP Server running on http://localhost:${PORT}`);
  });
}