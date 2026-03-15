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
        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        padding: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          opacity: 0.5,
          zIndex: 0,
        },
      }}
    >
      {/* Decorative Background Shapes */}
      <Box
        sx={{
          position: 'absolute',
          width: '600px',
          height: '400px',
          borderRadius: '45% 55% 60% 40% / 55% 45% 55% 45%',
          background: 'rgba(59, 131, 246, 0.59)',
          top: '-150px',
          right: '-200px',
          zIndex: 1,
          filter: 'blur(1px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
          background: 'rgba(34, 197, 94, 0.6)',
          bottom: '-100px',
          left: '-150px',
          zIndex: 1,
          filter: 'blur(1px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '550px',
          height: '350px',
          borderRadius: '65% 35% 40% 60% / 43% 47% 53% 57%',
          background: 'rgba(245, 159, 11, 0.63)',
          top: '-50px',
          left: '-200px',
          zIndex: 1,
          filter: 'blur(1px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '480px',
          height: '320px',
          borderRadius: '55% 45% 52% 48% / 48% 52% 48% 52%',
          background: 'rgba(239, 68, 68, 0.64)',
          top: '-100px',
          left: '20%',
          zIndex: 1,
          filter: 'blur(1px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '520px',
          height: '380px',
          borderRadius: '70% 30% 46% 54% / 30% 50% 50% 70%',
          background: 'rgba(138, 92, 246, 0.66)',
          bottom: '-80px',
          right: '-150px',
          zIndex: 1,
          filter: 'blur(1px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
          background: 'rgba(34, 197, 94, 0.6)',
          top: '30%',
          left: '80%',
          zIndex: 1,
          filter: 'blur(1px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '350px',
          height: '350px',
          borderRadius: '50% 50% 40% 60% / 60% 40% 60% 40%',
          background: 'rgba(245, 159, 11, 0.24)',
          bottom: '-20%',
          left: '10%',
          zIndex: 1,
          filter: 'blur(1px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '420px',
          height: '280px',
          borderRadius: '35% 65% 42% 58% / 72% 38% 62% 28%',
          background: 'rgba(59, 131, 246, 0.47)',
          top: '80%',
          left: '25%',
          zIndex: 1,
          filter: 'blur(1px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '380px',
          height: '280px',
          borderRadius: '62% 38% 66% 34% / 40% 62% 38% 60%',
          background: 'rgba(239, 68, 68, 0.39)',
          bottom: '-5%',
          right: '20%',
          zIndex: 1,
          filter: 'blur(1px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '320px',
          height: '420px',
          borderRadius: '78% 22% 48% 52% / 28% 68% 32% 72%',
          background: 'rgba(34, 197, 94, 0.44)',
          right: '25%',
          top: '-20%',
          zIndex: 1,
          filter: 'blur(1px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '440px',
          height: '340px',
          borderRadius: '48% 52% 38% 62% / 58% 42% 58% 42%',
          background: 'rgba(245, 158, 11, 0.08)',
          bottom: '-50px',
          left: '40%',
          zIndex: 1,
          filter: 'blur(1px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '360px',
          height: '360px',
          borderRadius: '67% 33% 55% 45% / 45% 55% 45% 55%',
          background: 'rgba(59, 130, 246, 0.12)',
          top: '60%',
          right: '-50px',
          zIndex: 1,
          filter: 'blur(1px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50% 50% 60% 40% / 40% 60% 40% 60%',
          background: 'rgba(239, 68, 68, 0.07)',
          top: '15%',
          left: '-80px',
          zIndex: 1,
          filter: 'blur(1px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '420px',
          height: '280px',
          borderRadius: '35% 65% 42% 58% / 72% 38% 62% 28%',
          background: 'rgba(59, 131, 246, 0.47)',
          bottom: '70%',
          zIndex: 1,
          filter: 'blur(1px)',
        }}
      />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
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
                padding: '12px 22px',
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
              Log in
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
