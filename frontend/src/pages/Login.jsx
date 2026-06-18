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
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { authService } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.login(email, password);
      localStorage.setItem('token', res.data.access_token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check credentials.');
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
              Health Assistant Intellegent
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Multi-Agent Healthcare Coordinator
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                className="glass-input"
                label="Email Address"
                type="email"
                variant="outlined"
                fullWidth
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
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
                  '& input::placeholder': { color: '#475569', opacity: 1 },
                }}
              />

              <TextField
                className="glass-input"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ color: '#64748b' }}>
                      <LockIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: '#64748b' }}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& label': { color: '#64748b' },
                  '& label.Mui-focused': { color: '#38bdf8' },
                  '& input::placeholder': { color: '#475569', opacity: 1 },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 1,
                  py: 1.5,
                  borderRadius: '12px',
                  backgroundColor: '#38bdf8',
                  color: '#0a0f1d',
                  fontWeight: 700,
                  fontSize: '1rem',
                  '&:hover': {
                    backgroundColor: '#0ea5e9',
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(56, 189, 248, 0.3)',
                    color: 'rgba(10, 15, 29, 0.5)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {loading ? 'Logging in...' : 'Sign In'}
              </Button>
            </Box>
          </form>

          {/* Footer Navigation */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Don't have an account?{' '}
              <Link
                component={RouterLink}
                to="/register"
                sx={{
                  color: '#8b5cf6',
                  fontWeight: 600,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Sign Up
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
