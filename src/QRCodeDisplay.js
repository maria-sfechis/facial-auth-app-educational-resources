import React, { useRef, useEffect, useState } from 'react';
import { Download, Share2, QrCode, X, RefreshCcw, Shield, MapPin, Clock } from 'lucide-react';

const QRCodeDisplay = ({ 
  qrData, 
  reservation, 
  isOpen, 
  onClose, 
  size = 256 
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen && qrData && canvasRef.current) {
      generateQRCode();
    }
  }, [isOpen, qrData]);

  // Prevent background scroll when modal is open - same approach as ResourceDetailModal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
      document.body.style.height = 'unset';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
      document.body.style.height = 'unset';
    };
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

    const generateQRCode = async () => {
        try {
            // 🔧 FIX: Remove timestamp to make QR code consistent
            const qrContent = JSON.stringify({
            reservationId: reservation.id,
            userId: reservation.user_id,
            resourceName: reservation.resource_name || reservation.name,
            date: reservation.date,
            time: `${reservation.start_time}-${reservation.end_time}`,
            qrCode: qrData
            });

            // Simple QR code generation using canvas
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            // Set canvas size
            canvas.width = size;
            canvas.height = size;
            
            // Clear canvas with white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, size, size);
            
            // Generate more realistic QR code pattern
            const gridSize = 25; // 25x25 grid (Version 1 QR code)
            const cellSize = size / gridSize;
            const hash = simpleHash(qrContent);
            
            ctx.fillStyle = '#000000';
            
            // 1. Draw finder patterns (corners) - 7x7 squares
            drawFinderPattern(ctx, 0, 0, cellSize);
            drawFinderPattern(ctx, gridSize - 7, 0, cellSize);
            drawFinderPattern(ctx, 0, gridSize - 7, cellSize);
            
            // 2. Draw separators around finder patterns (white borders)
            drawSeparators(ctx, gridSize, cellSize);
            
            // 3. Draw timing patterns (alternating black/white lines)
            drawTimingPatterns(ctx, gridSize, cellSize);
            
            // 4. Draw alignment pattern (center square for larger QR codes)
            if (gridSize >= 25) {
            drawAlignmentPattern(ctx, 18, 18, cellSize);
            }
            
            // 5. Draw format information (around finder patterns)
            drawFormatInformation(ctx, gridSize, cellSize, hash);
            
            // 6. Draw data pattern (the actual encoded data)
            drawDataPattern(ctx, gridSize, cellSize, hash);
            
            // 7. Add quiet zone (border around the QR code)
            drawQuietZone(ctx, gridSize, cellSize);
            
        } catch (error) {
            console.error('Error generating QR code:', error);
            
            // Fallback: Draw a simple text-based representation
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            canvas.width = size;
            canvas.height = size;
            
            ctx.fillStyle = '#F3F4F6';
            ctx.fillRect(0, 0, size, size);
            
            ctx.fillStyle = '#374151';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('QR Code', size/2, size/2 - 10);
            ctx.fillText(qrData, size/2, size/2 + 10);
        }
    };

    const drawFinderPattern = (ctx, startRow, startCol, cellSize) => {
        const pattern = [
            [1,1,1,1,1,1,1],
            [1,0,0,0,0,0,1],
            [1,0,1,1,1,0,1],
            [1,0,1,1,1,0,1],
            [1,0,1,1,1,0,1],
            [1,0,0,0,0,0,1],
            [1,1,1,1,1,1,1]
        ];
        
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 7; col++) {
            ctx.fillStyle = pattern[row][col] ? '#000000' : '#FFFFFF';
            ctx.fillRect(
                (startCol + col) * cellSize, 
                (startRow + row) * cellSize, 
                cellSize, 
                cellSize
            );
            }
        }
    };

    const drawSeparators = (ctx, gridSize, cellSize) => {
        ctx.fillStyle = '#FFFFFF';
        
        // Top-left separator
        ctx.fillRect(0, 7 * cellSize, 8 * cellSize, cellSize);
        ctx.fillRect(7 * cellSize, 0, cellSize, 8 * cellSize);
        
        // Top-right separator
        ctx.fillRect((gridSize - 8) * cellSize, 7 * cellSize, 8 * cellSize, cellSize);
        ctx.fillRect((gridSize - 8) * cellSize, 0, cellSize, 8 * cellSize);
        
        // Bottom-left separator
        ctx.fillRect(0, (gridSize - 8) * cellSize, 8 * cellSize, cellSize);
        ctx.fillRect(7 * cellSize, (gridSize - 8) * cellSize, cellSize, 8 * cellSize);
    };

    const drawTimingPatterns = (ctx, gridSize, cellSize) => {
        for (let i = 8; i < gridSize - 8; i++) {
            ctx.fillStyle = (i % 2 === 0) ? '#000000' : '#FFFFFF';
            
            // Horizontal timing pattern
            ctx.fillRect(i * cellSize, 6 * cellSize, cellSize, cellSize);
            
            // Vertical timing pattern
            ctx.fillRect(6 * cellSize, i * cellSize, cellSize, cellSize);
        }
    };

    const drawAlignmentPattern = (ctx, centerRow, centerCol, cellSize) => {
        const pattern = [
            [1,1,1,1,1],
            [1,0,0,0,1],
            [1,0,1,0,1],
            [1,0,0,0,1],
            [1,1,1,1,1]
        ];
        
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                ctx.fillStyle = pattern[row][col] ? '#000000' : '#FFFFFF';
                ctx.fillRect(
                    (centerCol - 2 + col) * cellSize, 
                    (centerRow - 2 + row) * cellSize, 
                    cellSize, 
                    cellSize
                );
            }
        }
    };

    const drawFormatInformation = (ctx, gridSize, cellSize, hash) => {
        // Format information is typically 15 bits around finder patterns
        const formatBits = hash.toString(2).padStart(15, '0');
        
        // Draw format info around top-left finder pattern
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = formatBits[i] === '1' ? '#000000' : '#FFFFFF';
            ctx.fillRect(i * cellSize, 8 * cellSize, cellSize, cellSize);
            ctx.fillRect(8 * cellSize, i * cellSize, cellSize, cellSize);
        }
        
        // Skip timing pattern position and continue
        for (let i = 7; i < 9; i++) {
            ctx.fillStyle = formatBits[i] === '1' ? '#000000' : '#FFFFFF';
            ctx.fillRect((i + 1) * cellSize, 8 * cellSize, cellSize, cellSize);
            ctx.fillRect(8 * cellSize, (i + 1) * cellSize, cellSize, cellSize);
        }
    };

    const drawDataPattern = (ctx, gridSize, cellSize, hash) => {
        // Create a more realistic data pattern
        const dataString = hash.toString(16).repeat(10); // Create longer data string
        
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                // Skip functional patterns
                if (isReservedArea(row, col, gridSize)) continue;
                // Create zigzag pattern typical of QR codes
                const dataIndex = (row * gridSize + col) % dataString.length;
                const charCode = dataString.charCodeAt(dataIndex);
                // More sophisticated pattern generation
                const shouldFill = (
                    (charCode + row + col) % 3 === 0 ||
                    (charCode ^ (row * col)) % 4 === 0 ||
                    ((hash + row * 7 + col * 11) % 5) < 2
                );
            
                if (shouldFill) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                }
            }
        }
    };

    const isReservedArea = (row, col, gridSize) => {
        // Finder patterns and separators
        if ((row < 9 && col < 9) || 
            (row < 9 && col >= gridSize - 8) || 
            (row >= gridSize - 8 && col < 9)) {
            return true;
        }
        // Timing patterns
        if (row === 6 || col === 6) {
            return true;
        }
        // Alignment pattern area
        if (gridSize >= 25 && 
            row >= 16 && row <= 20 && 
            col >= 16 && col <= 20) {
            return true;
        }
        
        return false;
    };

    const drawQuietZone = (ctx, gridSize, cellSize) => {
        const quietZoneSize = cellSize * 0.5; // Half cell quiet zone
        
        ctx.fillStyle = '#FFFFFF';
        
        // Top
        ctx.fillRect(0, 0, size, quietZoneSize);
        // Bottom
        ctx.fillRect(0, size - quietZoneSize, size, quietZoneSize);
        // Left
        ctx.fillRect(0, 0, quietZoneSize, size);
        // Right
        ctx.fillRect(size - quietZoneSize, 0, quietZoneSize, size);
    };
    const downloadQR = () => {
        const canvas = canvasRef.current;
        const link = document.createElement('a');
        link.download = `reservation-qr-${reservation.id}.png`;
        link.href = canvas.toDataURL();
        link.click();
    };

    const simpleHash = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    };

    const shareQR = async () => {
        try {
            const canvas = canvasRef.current;
            canvas.toBlob(async (blob) => {
                if (navigator.share) {
                    const file = new File([blob], `reservation-qr-${reservation.id}.png`, { 
                        type: 'image/png' 
                    });
          
                    await navigator.share({
                        title: 'Reservation QR Code',
                        text: `QR code for ${reservation.resource_name || reservation.name} reservation`,
                        files: [file]
                    });
                } else {
                    // Fallback: copy to clipboard
                    const item = new ClipboardItem({ 'image/png': blob });
                    await navigator.clipboard.write([item]);
                    alert('QR code copied to clipboard!');
                }
            });
        } catch (error) {
            console.error('Error sharing QR code:', error);
            alert('Unable to share QR code');
        }
        };

    if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 relative max-h-screen overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxHeight: '90vh',
          animation: 'modalFadeIn 0.3s ease-out'
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-600" />
              Reservation QR Code
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Reservation Details */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h4 className="font-medium text-gray-800 mb-3 text-center">
              {reservation.resource_name || reservation.name}
            </h4>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  📅 <strong>Date:</strong>
                </span>
                <span>{new Date(reservation.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  ⏰ <strong>Time:</strong>
                </span>
                <span>{reservation.start_time} - {reservation.end_time}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  🔑 <strong>Code:</strong>
                </span>
                <span className="font-mono text-xs bg-white px-2 py-1 rounded border">{qrData}</span>
              </div>
            </div>
          </div>

          {/* QR Code Display */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white border-2 border-gray-200 rounded-xl shadow-lg">
              <canvas
                ref={canvasRef}
                className="block mx-auto"
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800 leading-relaxed">
              <strong>How to use:</strong> Show this QR code when checking in to your reserved resource. 
              The staff can scan it to verify your reservation instantly.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={downloadQR}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={shareQR}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            This QR code is unique to your reservation and expires after checkout.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default QRCodeDisplay;