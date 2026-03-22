import React from 'react';
import type { ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#f3f4f6',
            padding: 2,
          }}
        >
          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: 4,
              maxWidth: '500px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#1f2937',
                marginBottom: 2,
              }}
            >
              Oops! Something went wrong
            </Typography>
            <Typography
              sx={{
                color: '#6b7280',
                marginBottom: 3,
                fontSize: '14px',
              }}
            >
              We encountered an error. Try refreshing the page or using manual entry instead of the camera.
            </Typography>
            {import.meta.env.MODE === 'development' && this.state.error && (
              <Box
                sx={{
                  backgroundColor: '#fee2e2',
                  borderRadius: '8px',
                  padding: 2,
                  marginBottom: 3,
                  textAlign: 'left',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: '#7f1d1d',
                    fontFamily: 'monospace',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.message}
                </Typography>
              </Box>
            )}
            <Button
              onClick={this.handleReset}
              variant="contained"
              sx={{
                marginRight: 1,
                backgroundColor: '#3b82f6',
                '&:hover': { backgroundColor: '#2563eb' },
              }}
            >
              Try Again
            </Button>
            <Button
              onClick={() => globalThis.location.reload()}
              variant="outlined"
              sx={{
                borderColor: '#3b82f6',
                color: '#3b82f6',
              }}
            >
              Refresh Page
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
