import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import './index.css';

// Create a custom modern dark theme matching our CSS variables
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#38bdf8', // Sky blue
      dark: '#0ea5e9',
      contrastText: '#0a0f1d',
    },
    secondary: {
      main: '#8b5cf6', // Soft purple
      dark: '#7c3aed',
      contrastText: '#f8fafc',
    },
    background: {
      default: '#0a0f1d', // Deep space background
      paper: '#111827',   // Card background
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
    success: {
      main: '#10b981',
    },
    warning: {
      main: '#f59e0b',
    },
    error: {
      main: '#ef4444',
    },
  },
  typography: {
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.6 },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '8px 20px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none', // Remove default MUI overlay gradient
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.05)',
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
