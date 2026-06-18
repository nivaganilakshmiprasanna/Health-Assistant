import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Button
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AssignmentInd as AssessmentIcon,
  Description as ReportsIcon,
  MedicalServices as MedicationIcon,
  Restaurant as NutritionIcon,
  FitnessCenter as LifestyleIcon,
  Warning as EmergencyIcon,
  TrendingUp as AnalyticsIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';

const sidebarWidth = 280;

const menuItems = [
  { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { text: 'Health Assessment', path: '/assessment', icon: <AssessmentIcon /> },
  { text: 'Medical Reports', path: '/reports', icon: <ReportsIcon /> },
  { text: 'Medications', path: '/medications', icon: <MedicationIcon /> },
  { text: 'Nutrition Plans', path: '/nutrition', icon: <NutritionIcon /> },
  { text: 'Lifestyle Tracking', path: '/lifestyle', icon: <LifestyleIcon /> },
  { text: 'Emergency Alerts', path: '/emergency', icon: <EmergencyIcon /> },
  { text: 'Progress Analytics', path: '/analytics', icon: <AnalyticsIcon /> },
  { text: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: sidebarWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: sidebarWidth,
          boxSizing: 'border-box',
          backgroundColor: '#0a0f1d',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        },
      }}
    >
      <Box>
        {/* Brand Header */}
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Health Assistant Intellegent
          </Typography>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

        {/* Menu List */}
        <List sx={{ px: 2, py: 3 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isEmergency = item.text === 'Emergency Alerts';

            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: '12px',
                    py: 1.2,
                    px: 2,
                    backgroundColor: isActive 
                      ? (isEmergency ? 'rgba(220, 38, 38, 0.15)' : 'rgba(56, 189, 248, 0.1)') 
                      : 'transparent',
                    color: isActive 
                      ? (isEmergency ? '#f87171' : '#38bdf8') 
                      : '#94a3b8',
                    border: '1px solid',
                    borderColor: isActive 
                      ? (isEmergency ? 'rgba(220, 38, 38, 0.3)' : 'rgba(56, 189, 248, 0.2)') 
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: isEmergency ? 'rgba(220, 38, 38, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      color: isEmergency ? '#f87171' : '#f8fafc',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: 'inherit',
                      minWidth: '40px',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 400,
                      fontSize: '0.95rem',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Logout Button */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 2 }} />
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            py: 1.2,
            borderRadius: '12px',
            borderColor: 'rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.02)',
            '&:hover': {
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          Logout
        </Button>
      </Box>
    </Drawer>
  );
}
