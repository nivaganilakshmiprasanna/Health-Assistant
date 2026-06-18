import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  FitnessCenter as ActiveIcon,
  Bedtime as SleepIcon,
  WaterDrop as WaterIcon,
  Save as SaveIcon,
  CalendarToday as DateIcon
} from '@mui/icons-material';
import { lifestyleService } from '../services/api';

export default function LifestyleTracking() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Daily Logging Form Inputs
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [sleepHours, setSleepHours] = useState('');
  const [waterMl, setWaterMl] = useState('');
  const [steps, setSteps] = useState('');
  const [activeMinutes, setActiveMinutes] = useState('');
  const [exerciseType, setExerciseType] = useState('');

  const fetchLogs = async () => {
    try {
      const logsRes = await lifestyleService.getLogs();
      setLogs(logsRes.data);
      
      // Pre-fill fields for the active date if log exists
      const activeLog = logsRes.data.find(l => l.log_date === logDate);
      if (activeLog) {
        setSleepHours(activeLog.sleep_hours.toString());
        setWaterMl(activeLog.water_ml.toString());
        setSteps(activeLog.steps.toString());
        setActiveMinutes(activeLog.active_minutes.toString());
        setExerciseType(activeLog.exercise_type || '');
      } else {
        setSleepHours('');
        setWaterMl('');
        setSteps('');
        setActiveMinutes('');
        setExerciseType('');
      }
    } catch (err) {
      console.error('Failed to load lifestyle logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [logDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await lifestyleService.logLifestyle({
        log_date: logDate,
        sleep_hours: parseFloat(sleepHours || '0'),
        water_ml: parseInt(waterMl || '0'),
        steps: parseInt(steps || '0'),
        active_minutes: parseInt(activeMinutes || '0'),
        exercise_type: exerciseType || 'None'
      });
      setSuccess('Habits logged and wellness score updated successfully!');
      fetchLogs();
    } catch (err) {
      setError('Failed to log lifestyle metrics.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={60} sx={{ color: '#38bdf8' }} />
      </Box>
    );
  }

  // Find current active logs details for progress meters
  const currentLog = logs.find(l => l.log_date === logDate) || {
    sleep_hours: 0,
    water_ml: 0,
    steps: 0,
    active_minutes: 0,
    exercise_type: 'None'
  };

  return (
    <Grid container spacing={4}>
      
      {/* Left Column: Logging Form */}
      <Grid item xs={12} lg={5}>
        <Card className="glass-panel" sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <DateIcon sx={{ color: '#38bdf8' }} /> Habits Logging
            </Typography>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 3 }} />

            {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px' }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2.5, borderRadius: '10px' }}>{success}</Alert>}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2.5}>
                
                <Grid item xs={12}>
                  <TextField
                    className="glass-input"
                    label="Log Date"
                    type="date"
                    variant="outlined"
                    fullWidth
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& label': { color: '#64748b' }, '& label.Mui-focused': { color: '#38bdf8' } }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    className="glass-input"
                    label="Sleep Duration (hrs)"
                    type="number"
                    inputProps={{ step: 0.1, min: 0 }}
                    variant="outlined"
                    fullWidth
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    sx={{ '& label': { color: '#64748b' }, '& label.Mui-focused': { color: '#38bdf8' } }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    className="glass-input"
                    label="Water Intake (ml)"
                    type="number"
                    inputProps={{ min: 0 }}
                    variant="outlined"
                    fullWidth
                    value={waterMl}
                    onChange={(e) => setWaterMl(e.target.value)}
                    sx={{ '& label': { color: '#64748b' }, '& label.Mui-focused': { color: '#38bdf8' } }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    className="glass-input"
                    label="Total Steps"
                    type="number"
                    inputProps={{ min: 0 }}
                    variant="outlined"
                    fullWidth
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                    sx={{ '& label': { color: '#64748b' }, '& label.Mui-focused': { color: '#38bdf8' } }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    className="glass-input"
                    label="Active Duration (mins)"
                    type="number"
                    inputProps={{ min: 0 }}
                    variant="outlined"
                    fullWidth
                    value={activeMinutes}
                    onChange={(e) => setActiveMinutes(e.target.value)}
                    sx={{ '& label': { color: '#64748b' }, '& label.Mui-focused': { color: '#38bdf8' } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    className="glass-input"
                    label="Exercise/Activity Type (e.g. Yoga, Running)"
                    variant="outlined"
                    fullWidth
                    value={exerciseType}
                    onChange={(e) => setExerciseType(e.target.value)}
                    sx={{ '& label': { color: '#64748b' }, '& label.Mui-focused': { color: '#38bdf8' } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={submitting}
                    startIcon={submitting ? <CircularProgress size={20} sx={{ color: '#0a0f1d' }} /> : <SaveIcon />}
                    sx={{
                      py: 1.5,
                      borderRadius: '11px',
                      backgroundColor: '#38bdf8',
                      color: '#0a0f1d',
                      fontWeight: 700,
                      '&:hover': { backgroundColor: '#0ea5e9' }
                    }}
                  >
                    {submitting ? 'Saving Logs...' : 'Save Log Entries'}
                  </Button>
                </Grid>

              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grid>

      {/* Right Column: Daily Targets & Progress */}
      <Grid item xs={12} lg={7}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          
          {/* Targets Breakdown */}
          <Card className="glass-panel" sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Daily Targets Achievement ({logDate})
              </Typography>
              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

              {/* Sleep Target */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, color: '#e6edf3' }}>
                    <SleepIcon sx={{ color: '#a78bfa' }} /> Sleep Duration
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    {currentLog.sleep_hours} hrs / 8 hrs target
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, (currentLog.sleep_hours / 8.0) * 100)}
                  sx={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.04)', '& .MuiLinearProgress-bar': { backgroundColor: '#a78bfa' } }}
                />
              </Box>

              {/* Water Target */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, color: '#e6edf3' }}>
                    <WaterIcon sx={{ color: '#38bdf8' }} /> Water Hydration
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    {currentLog.water_ml} ml / 3000 ml target
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, (currentLog.water_ml / 3000.0) * 100)}
                  sx={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.04)', '& .MuiLinearProgress-bar': { backgroundColor: '#38bdf8' } }}
                />
              </Box>

              {/* Steps Target */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, color: '#e6edf3' }}>
                    <ActiveIcon sx={{ color: '#10b981' }} /> Step Count
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    {currentLog.steps} steps / 10,000 steps target
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, (currentLog.steps / 10000.0) * 100)}
                  sx={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.04)', '& .MuiLinearProgress-bar': { backgroundColor: '#10b981' } }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Historical Logs List Table */}
          <Card className="glass-panel">
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Historical Habits Log
              </Typography>
              
              {logs.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', py: 4 }}>
                  No historical logs recorded.
                </Typography>
              ) : (
                <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <TableRow>
                        <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }} align="center">Sleep</TableCell>
                        <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }} align="center">Water</TableCell>
                        <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }} align="center">Steps</TableCell>
                        <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }}>Activity</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell sx={{ color: '#f8fafc', fontWeight: 500 }}>{log.log_date}</TableCell>
                          <TableCell align="center" sx={{ color: '#a78bfa' }}>{log.sleep_hours}h</TableCell>
                          <TableCell align="center" sx={{ color: '#38bdf8' }}>{log.water_ml}ml</TableCell>
                          <TableCell align="center" sx={{ color: '#10b981' }}>{log.steps.toLocaleString()}</TableCell>
                          <TableCell sx={{ color: '#64748b', fontSize: '0.8rem' }}>{log.exercise_type || 'None'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

        </Box>
      </Grid>

    </Grid>
  );
}
