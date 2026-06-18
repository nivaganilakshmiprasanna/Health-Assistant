import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Typography, Button, Divider, Box } from '@mui/material';
import { Settings as SettingsIcon, ExitToApp as LogoutIcon } from '@mui/icons-material';

export default function Settings() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Card className="glass-panel" sx={{ maxWidth: 600, mx: 'auto', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon sx={{ color: '#38bdf8' }} /> Account Configurations
        </Typography>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#e6edf3' }}>
              Developer Mode & Logs
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5, mb: 1.5 }}>
              Database schemas and custom multi-agent routing are stored locally in the healthpilot.db SQLite file.
            </Typography>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.04)' }} />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#e6edf3' }}>
              Session Management
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5, mb: 2 }}>
              Clear active session token and log out of the Coordinator interface.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ borderRadius: '10px', fontWeight: 600 }}
            >
              Sign Out
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
