import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, CircularProgress, Typography, Button, Alert } from '@mui/material';
import { FiX } from 'react-icons/fi';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export function QRScanner({ open, onClose, onScan }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (e) {
        console.error('Error closing scanner:', e);
      }
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const initializeScanner = async () => {
      try {
        setLoading(true);
        setError(null);

        // Stop any existing scanner
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
            await scannerRef.current.clear();
          } catch (e) {
            console.error('Error stopping previous scanner:', e);
          }
        }

        // Create new scanner
        const scanner = new Html5Qrcode('qr-scanner-container', {
          verbose: false,
        });

        // Start camera with optimized settings
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 30,
            qrbox: { width: 400, height: 400 },
            aspectRatio: 1.0,
            disableFlip: false,
          },
          (decodedText) => {
            console.log('QR Code scanned successfully:', decodedText);
            onScan(decodedText.trim());
            handleClose();
          },
          (errorMessage) => {
            // Only log actual errors, not the repeated "No QR found" messages
            if (errorMessage && !errorMessage.toLowerCase().includes('no qr code found')) {
              console.debug('QR Scanner debug:', errorMessage);
            }
          }
        );

        scannerRef.current = scanner;
        setLoading(false);
      } catch (err) {
        console.error('Error initializing scanner:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to initialize camera';
        
        if (errorMsg.includes('NotAllowedError') || errorMsg.includes('Permission')) {
          setError('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (errorMsg.includes('NotFoundError')) {
          setError('No camera found on this device.');
        } else {
          setError(`Camera error: ${errorMsg}`);
        }
        setLoading(false);
      }
    };

    initializeScanner();

    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch((e) => {
          console.error('Error stopping scanner:', e);
        });
      }
    };
  }, [open, onScan, handleClose]);

  if (!open) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Close button */}
      <Box
        onClick={handleClose}
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderRadius: '50%',
          width: 50,
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10000,
          '&:hover': {
            backgroundColor: '#fff',
          },
        }}
      >
        <FiX size={24} color="#000" />
      </Box>

      {/* Scanner container */}
      <Box
        id="qr-scanner-container"
        sx={{
          width: '100%',
          height: '100%',
          maxWidth: '500px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />

      {/* Loading overlay */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9998,
          }}
        >
          <CircularProgress size={60} sx={{ color: '#fff' }} />
          <Typography sx={{ color: '#fff', mt: 2, fontSize: '16px' }}>
            Initializing camera...
          </Typography>
        </Box>
      )}

      {/* Error display */}
      {error && (
        <Box
          sx={{
            position: 'absolute',
            top: 80,
            left: 20,
            right: 20,
            zIndex: 10001,
          }}
        >
          <Alert severity="error" sx={{ borderRadius: '8px' }}>
            {error}
          </Alert>
          <Button
            onClick={handleClose}
            variant="contained"
            sx={{
              mt: 2,
              backgroundColor: '#3b82f6',
              width: '100%',
              '&:hover': { backgroundColor: '#2563eb' },
            }}
          >
            Close
          </Button>
        </Box>
      )}

      {/* Focus indicator and instructions */}
      {!loading && !error && (
        <>
          {/* Scanning indicator */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '420px',
              height: '420px',
              border: '3px solid #4ade80',
              borderRadius: '12px',
              boxShadow: '0 0 0 4px rgba(74, 222, 128, 0.1)',
              pointerEvents: 'none',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  boxShadow: '0 0 0 4px rgba(74, 222, 128, 0.1)',
                },
                '50%': {
                  boxShadow: '0 0 0 8px rgba(74, 222, 128, 0.2)',
                },
              },
            }}
          />

          {/* Instructions */}
          <Typography
            sx={{
              position: 'absolute',
              bottom: 80,
              color: '#fff',
              fontSize: '16px',
              textAlign: 'center',
              maxWidth: '80%',
              fontWeight: 500,
            }}
          >
            Point your camera at a QR code
          </Typography>
          <Typography
            sx={{
              position: 'absolute',
              bottom: 40,
              color: '#9ca3af',
              fontSize: '12px',
              textAlign: 'center',
              maxWidth: '80%',
            }}
          >
            Position the QR code within the green box
          </Typography>
        </>
      )}
    </Box>
  );
}
