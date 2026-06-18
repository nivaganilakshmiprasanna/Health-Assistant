import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  AlertTitle,
  Grid,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Warning as EmergencyIcon,
  Send as SendIcon,
  LocalPhone as PhoneIcon,
  LocalHospital as HospitalIcon,
  ErrorOutline as WarningIcon
} from '@mui/icons-material';
import { coordinatorService } from '../services/api';

export default function EmergencyAlerts() {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleTriage = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Send symptoms directly to the coordinator. The emergency agent will be triggered.
      const res = await coordinatorService.coordinate(symptoms);
      const emergencyData = res.data.shared_context?.emergency_status;
      
      if (emergencyData) {
        setResult(emergencyData);
      } else {
        setResult({
          is_emergency: false,
          risk_level: 'Low',
          reason: 'No emergency indicators detected in description.',
          immediate_instructions: 'Monitor symptoms. Consult a physician if condition persists.',
          alerts: []
        });
      }
    } catch (err) {
      setError('Triage connection failed. Please contact local emergency services immediately if you are in distress.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    if (level === 'High') return '#ef4444';
    if (level === 'Medium') return '#f59e0b';
    return '#10b981';
  };

  return (
    <Grid container spacing={4}>
      
      {/* Triage Questionnaire Left */}
      <Grid item xs={12} md={5}>
        <Card className="glass-panel" sx={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: '#ef4444' }}>
              <EmergencyIcon /> Clinical Triage Checker
            </Typography>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 3 }} />

            <Alert severity="warning" sx={{ mb: 3, borderRadius: '12px' }}>
              <AlertTitle sx={{ fontWeight: 700 }}>Immediate Medical Emergency?</AlertTitle>
              If you are experiencing sudden severe chest pain, pressure in the chest, breathing difficulties, sudden numbness in your face or limbs, or slurred speech, seek immediate hospitalization or dial **108 / 112** (India) or **911** (US) directly.
            </Alert>

            <form onSubmit={handleTriage}>
              <TextField
                className="glass-input"
                label="Describe your symptoms in detail (e.g. 'I feel a crushing pain in my chest radiating to my left arm')"
                multiline
                rows={6}
                variant="outlined"
                fullWidth
                required
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                sx={{ '& label': { color: '#64748b' }, '& label.Mui-focused': { color: '#ef4444' }, mb: 3 }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} sx={{ color: '#0a0f1d' }} /> : <SendIcon />}
                sx={{
                  py: 1.5,
                  borderRadius: '11px',
                  backgroundColor: '#ef4444',
                  color: '#f8fafc',
                  fontWeight: 700,
                  '&:hover': { backgroundColor: '#dc2626' }
                }}
              >
                {loading ? 'Analyzing Symptoms...' : 'Analyze Emergency Risk'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Grid>

      {/* Emergency Guide & Results Right */}
      <Grid item xs={12} md={7}>
        <Card className="glass-panel" sx={{ height: '100%', minHeight: 450 }}>
          <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Triage Diagnostic Assessment
            </Typography>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 3 }} />

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

            {result ? (
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                
                {/* Risk Level Badge */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#94a3b8' }}>
                    Risk Classification:
                  </Typography>
                  <Box
                    sx={{
                      px: 2,
                      py: 0.8,
                      borderRadius: '8px',
                      backgroundColor: `${getRiskColor(result.risk_level)}20`,
                      border: `1px solid ${getRiskColor(result.risk_level)}`,
                      color: getRiskColor(result.risk_level),
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      textTransform: 'uppercase'
                    }}
                  >
                    {result.risk_level} Risk
                  </Box>
                </Box>

                {/* Clinical Justification */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc', mb: 1 }}>
                    Symptom Analysis:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
                    {result.reason}
                  </Typography>
                </Box>

                {/* Immediate Instructions */}
                {result.immediate_instructions && (
                  <Alert
                    severity={result.risk_level === 'High' ? 'error' : 'warning'}
                    icon={<WarningIcon />}
                    sx={{ borderRadius: '12px', py: 1.5 }}
                  >
                    <AlertTitle sx={{ fontWeight: 700 }}>Action Required Immediately</AlertTitle>
                    {result.immediate_instructions}
                  </Alert>
                )}

                {/* Warnings Checklist */}
                {result.alerts?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ef4444', mb: 1.5 }}>
                      Red Flag Warning Symptoms to Monitor:
                    </Typography>
                    <List sx={{ p: 0 }}>
                      {result.alerts.map((alert, idx) => (
                        <ListItem key={idx} disablePadding sx={{ mb: 1, alignItems: 'flex-start' }}>
                          <ListItemIcon sx={{ minWidth: 24, color: '#ef4444', mt: 0.3 }}>
                            <WarningIcon sx={{ fontSize: 14 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={alert}
                            primaryTypographyProps={{ fontSize: '0.85rem', color: '#94a3b8' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, py: 10, textAlign: 'center' }}>
                <EmergencyIcon sx={{ fontSize: 80, color: 'rgba(255, 255, 255, 0.03)', mb: 2 }} />
                <Typography variant="body2" sx={{ color: '#64748b', maxAlign: 400 }}>
                  Submit the triage form to run immediate diagnostic routing. The emergency agent evaluates symptom urgency to prevent clinical risk.
                </Typography>
              </Box>
            )}

            {/* Helpline contact info always displayed at footer */}
            <Box sx={{ mt: 'auto', pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', gap: 2, alignItems: 'center' }}>
              <HospitalIcon sx={{ color: '#64748b' }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontWeight: 600 }}>
                  EMERGENCY DIAL SERVICES (INDIA)
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 700 }}>
                  Ambulance: 108 / 102 | General Helpline: 112 / 104
                </Typography>
              </Box>
            </Box>

          </CardContent>
        </Card>
      </Grid>

    </Grid>
  );
}
