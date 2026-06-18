import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { authService } from '../services/api';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.register(username, email, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0f1d',
        background: 'radial-gradient(circle at center, #111827 0%, #0a0f1d 100%)',
        p: 2
      }}
    >
      <Card
        className="glass-panel"
        sx={{
          width: '100%',
          maxWidth: 420,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #38bdf8 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              Get Started
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Create your Health Assistant Intellegent clinical portal
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}
          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>
              Registration successful! Redirecting...
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                className="glass-input"
                label="Full Username"
                type="text"
                variant="outlined"
                fullWidth
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ color: '#64748b' }}>
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& label': { color: '#64748b' },
                  '& label.Mui-focused': { color: '#38bdf8' },
                }}
              />

              <TextField
                className="glass-input"
                label="Email Address"
                type="email"
                variant="outlined"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ color: '#64748b' }}>
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& label': { color: '#64748b' },
                  '& label.Mui-focused': { color: '#38bdf8' },
                }}
              />

              <TextField
                className="glass-input"
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ color: '#64748b' }}>
                      <LockIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& label': { color: '#64748b' },
                  '& label.Mui-focused': { color: '#38bdf8' },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading || success}
                sx={{
                  mt: 1,
                  py: 1.5,
                  borderRadius: '12px',
                  backgroundColor: '#8b5cf6',
                  color: '#f8fafc',
                  fontWeight: 700,
                  fontSize: '1rem',
                  '&:hover': {
                    backgroundColor: '#7c3aed',
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(139, 92, 246, 0.3)',
                    color: 'rgba(255, 255, 255, 0.5)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {loading ? 'Creating Account...' : 'Register'}
              </Button>
            </Box>
          </form>

          {/* Footer Navigation */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Already registered?{' '}
              <Link
                component={RouterLink}
                to="/login"
                sx={{
                  color: '#38bdf8',
                  fontWeight: 600,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Sign In
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
