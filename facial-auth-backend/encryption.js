import crypto from 'crypto';

class EncryptionService {
  constructor() {
    // Use environment variable or generate a secure key
    this.algorithm = 'aes-256-cbc';
    this.key = process.env.ENCRYPTION_KEY 
      ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
      : crypto.randomBytes(32);
    
    // If no key in env, generate and show it (for development)
    if (!process.env.ENCRYPTION_KEY) {
      console.log('Generated encryption key (save this in .env):', this.key.toString('hex'));
    }
  }

  encrypt(data) {
    try {
      // Convert data to string if it's an object/array
      const text = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Generate a random IV for each encryption
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      
      // Encrypt the data
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Return IV + encrypted data
      return {
        iv: iv.toString('hex'),
        data: encrypted
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

  decrypt(encryptedData) {
    try {
      // Extract IV and encrypted data
      const iv = Buffer.from(encryptedData.iv, 'hex');
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      
      // Decrypt the data
      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Parse back to original format
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted; // Return as string if not JSON
      }
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  }

  // Hash function for additional security (e.g., for user IDs)
  hash(data) {
    return crypto.createHash('sha256').update(data.toString()).digest('hex');
  }
}

// Create instance and export methods
const encryptionService = new EncryptionService();

export const encrypt = encryptionService.encrypt.bind(encryptionService);
export const decrypt = encryptionService.decrypt.bind(encryptionService);
export const hash = encryptionService.hash.bind(encryptionService);

export default encryptionService;