import { Box, Container, Typography, Button, Card } from '@mui/material';
import { useState } from 'react';
import logoWhite from '../../assets/logo white.png';
import { LoginModal } from '../components/auth/LoginModal';

export default function Landing() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleStart = () => {
    setShowLoginModal(true);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            gap: 4,
            alignItems: 'stretch',
            justifyContent: 'center',
            flexWrap: 'nowrap',
          }}
        >
          {/* Logo Card - Left */}
          <Card
            sx={{
              borderRadius: '24px',
              padding: 4,
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              flex: 1,
              maxWidth: '400px',
              minWidth: '300px',
              height: '350px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.3s ease-in-out, boxShadow 0.3s ease-in-out',
            }}
          >
            <img
              src={logoWhite}
              alt="CLINIKA+"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </Card>

          {/* ACOWIS Card - Right */}
          <Card
            sx={{
              borderRadius: '12px',
              padding: 4,
              flex: 1,
              maxWidth: '400px',
              minWidth: '300px',
              height: '350px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
              border: '2px solid #3b82f6',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.3s ease-in-out, boxShadow 0.3s ease-in-out',
            }}
          >
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  color: '#3b82f6',
                  marginBottom: 1,
                  fontSize: { xs: '28px', sm: '32px', md: '36px' },
                }}
              >
                ACOWIS
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  color: '#3b82f6',
                  marginBottom: 2,
                  fontSize: '14px',
                  letterSpacing: '0.5px',
                }}
              >
                Adaptive Clinic Operations & Workforce Intelligence System
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 500,
                  color: '#3b82f6',
                  lineHeight: 1.8,
                  fontSize: '14px',
                  marginBottom: 3,
                }}
              >
                An intelligent clinic operations system that automates staff scheduling, tracks attendance in real time, and coordinates patient appointments—all while keeping everyone notified through instant, automated alerts.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={handleStart}
              sx={{
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: '16px',
                padding: '12px 32px',
                borderRadius: '8px',
                textTransform: 'capitalize',
                transition: 'all 0.3s ease-in-out',
                maxWidth: '100px',
                maxHeight: '40px',
                '&:hover': {
                  backgroundColor: '#1d4ed8',
                  transform: 'scale(1.05)',
                  boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                },
              }}
            >
              Start
            </Button>
            </Box>
          </Card>
        </Box>
      </Container>

      {/* Login Modal */}
      <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </Box>
  );
}
