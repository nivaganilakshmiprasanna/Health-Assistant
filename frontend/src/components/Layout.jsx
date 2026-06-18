import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Avatar, Container, Link } from '@mui/material';
import Navigation from './Navigation';
import VoiceAssistant from './VoiceAssistant';
import { authService } from '../services/api';

const sidebarWidth = 280;

export default function Layout() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Load current user profile details
    authService.getCurrentUser()
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        console.error('Failed to authenticate user token:', err);
        localStorage.removeItem('token');
        navigate('/login');
      });
  }, [navigate]);

  // Determine current section title based on route path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/assessment') return 'Health Assessment Profile';
    if (path === '/reports') return 'Medical Reports & Diagnostics';
    if (path === '/medications') return 'Medications & Prescriptions';
    if (path === '/nutrition') return 'Personalized Indian Nutrition Plans';
    if (path === '/lifestyle') return 'Lifestyle Habits & Logs';
    if (path === '/emergency') return 'Emergency Alerts & Triage';
    if (path === '/analytics') return 'Progress Analytics & Health Score';
    if (path === '/settings') return 'Account Settings';
    return 'Health Assistant Intellegent';
  };

  if (!user) {
    return null; // Return empty space while validating auth token
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0a0f1d' }}>
      {/* Permanent Sidebar Navigation */}
      <Navigation />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${sidebarWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Transparent top application bar */}
        <AppBar
          position="static"
          sx={{
            backgroundColor: 'transparent',
            boxShadow: 'none',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            py: 1,
          }}
        >
          <Toolbar sx={{ px: { xs: 3, md: 5 } }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                fontSize: '1.4rem',
                fontFamily: "'Outfit', sans-serif",
                color: '#f8fafc',
              }}
            >
              {getPageTitle()}
            </Typography>

            {/* Profile Avatar Widget */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#f8fafc' }}>
                  {user.username}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Patient User
                </Typography>
              </Box>
              <Avatar
                sx={{
                  width: 42,
                  height: 42,
                  bgcolor: '#8b5cf6',
                  fontWeight: 600,
                  fontSize: '1rem',
                  border: '2px solid rgba(139, 92, 246, 0.4)',
                }}
              >
                {user.username.slice(0, 2).toUpperCase()}
              </Avatar>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Content Container */}
        <Container
          maxWidth="xl"
          sx={{
            mt: 4,
            mb: 4,
            px: { xs: 3, md: 5 },
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Active nested page is rendered here */}
          <Outlet />
        </Container>

        {/* Global Footer Disclaimer */}
        <Box
          component="footer"
          sx={{
            py: 3,
            px: 3,
            mt: 'auto',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            textAlign: 'center',
            backgroundColor: 'rgba(10, 15, 29, 0.6)',
          }}
        >
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', maxWidth: 800, mx: 'auto', lineHeight: 1.5 }}>
            <strong>Disclaimer:</strong> Health Assistant Intellegent is an advanced agentic healthcare assistant designed for informational and coordinative support. It does not provide official medical diagnoses, treatment instructions, or prescriptions. Always consult a qualified medical professional for health issues or clinical decisions.
          </Typography>
        </Box>
      </Box>

      {/* Floating Voice Assistant Coordinator widget */}
      <VoiceAssistant />
    </Box>
  );
}
