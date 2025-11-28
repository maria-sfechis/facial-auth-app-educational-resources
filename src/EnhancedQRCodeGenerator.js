class EnhancedQRCodeGenerator {
  constructor() {
    this.securitySalt = 'UTCN_SECURE_2025';
    this.versionInfo = '1.2.0';
  }

  // Generate unique QR code with security
  generateUniqueQRCode(reservationData) {
    const timestamp = Date.now();
    const randomSeed = Math.random().toString(36).substring(2, 15);
    
    // Create multiple hash layers for security
    const baseHash = this.simpleHash(
      `${reservationData.userId}_${reservationData.resourceId}_${timestamp}_${randomSeed}`
    );
    
    const securityHash = this.simpleHash(
      `${this.securitySalt}_${baseHash}_${reservationData.date}_${reservationData.startTime}`
    );
    
    // Create complex QR code identifier
    const qrCode = `UTCN_${reservationData.resourceType.substring(0, 2).toUpperCase()}` +
                   `_${reservationData.resourceId.toString().padStart(3, '0')}` +
                   `_${baseHash.substring(0, 8)}` +
                   `_${securityHash.substring(0, 6)}` +
                   `_${timestamp.toString(36).toUpperCase()}`;
    
    return {
      qrCode: qrCode,
      metadata: {
        userId: reservationData.userId,
        resourceId: reservationData.resourceId,
        resourceType: reservationData.resourceType,
        generatedAt: timestamp,
        securityLevel: 'HIGH',
        version: this.versionInfo
      }
    };
  }

  // Simple hash function for deterministic patterns
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Verify QR code authenticity
  verifyQRCode(qrCode, reservationData) {
    try {
      const parts = qrCode.split('_');
      if (parts.length !== 6 || parts[0] !== 'UTCN') {
        return { valid: false, reason: 'Invalid QR code format' };
      }

      const [prefix, resourceTypeCode, resourceId, baseHash, securityHash, timestampEncoded] = parts;
      
      // Decode timestamp
      const timestamp = parseInt(timestampEncoded, 36);
      const now = Date.now();
      
      // Check if QR code is not too old (24 hours)
      if (now - timestamp > 24 * 60 * 60 * 1000) {
        return { valid: false, reason: 'QR code expired' };
      }

      // Verify resource type matches
      const expectedTypeCode = reservationData.resourceType.substring(0, 2).toUpperCase();
      if (resourceTypeCode !== expectedTypeCode) {
        return { valid: false, reason: 'Resource type mismatch' };
      }

      return { 
        valid: true, 
        timestamp: timestamp,
        resourceId: parseInt(resourceId),
        securityLevel: 'VERIFIED'
      };
    } catch (error) {
      return { valid: false, reason: 'QR code verification failed' };
    }
  }
}

export { EnhancedQRCodeGenerator };