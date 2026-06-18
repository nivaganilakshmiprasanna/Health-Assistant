import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Checkbox,
  FormControlLabel,
  Button,
  LinearProgress,
  IconButton,
  Alert,
  AlertTitle,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  WaterDrop as WaterIcon,
  LocalHospital as MedIcon,
  CheckCircleOutline as GoalIcon,
  Warning as EmergencyIcon,
  Description as ReportIcon,
  Add as AddIcon,
  ArrowForward as ArrowIcon,
  Bedtime as SleepIcon,
  DirectionsRun as ActiveIcon
} from '@mui/icons-material';
import { analyticsService, medicationsService, goalsService, lifestyleService } from '../services/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [waterAddLoading, setWaterAddLoading] = useState(false);
  const navigate = useNavigate();

  // Load dashboard dataset
  const fetchDashboardData = async () => {
    try {
      const res = await analyticsService.getDashboardData();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Log medication intake status
  const handleMedCheck = async (medId, timeSlot, currentStatus) => {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      await medicationsService.logAdherence(medId, todayStr, timeSlot, !currentStatus);
      fetchDashboardData(); // Reload stats to refresh health score
    } catch (err) {
      console.error('Failed to log medication adherence:', err);
    }
  };

  // Log water intake quick buttons
  const addWater = async (amount) => {
    if (!data) return;
    setWaterAddLoading(true);
    const newTotal = (data.lifestyle.water_ml || 0) + amount;
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      await lifestyleService.logLifestyle({
        log_date: todayStr,
        water_ml: newTotal,
        sleep_hours: data.lifestyle.sleep_hours || 0,
        steps: data.lifestyle.steps || 0,
        active_minutes: data.lifestyle.active_minutes || 0,
        exercise_type: data.lifestyle.exercise_type || 'None'
      });
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to log water intake:', err);
    } finally {
      setWaterAddLoading(false);
    }
  };

  // Mark goal as completed
  const handleCompleteGoal = async (goalId) => {
    try {
      await goalsService.updateGoal(goalId, 'Completed', 'completed');
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to complete goal:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={60} sx={{ color: '#38bdf8' }} />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ textAlign: 'center', mt: 10 }}>
        <Typography variant="h6" sx={{ color: '#94a3b8' }}>
          No data available. Please complete your Health Assessment Profile.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/assessment')}
          sx={{ mt: 3, backgroundColor: '#38bdf8', color: '#0a0f1d', fontWeight: 600 }}
        >
          Begin Health Assessment
        </Button>
      </Box>
    );
  }

  // Check if there are any emergency states triaged in recommendations or alerts
  const showEmergencyBanner = data.latest_report?.summary?.includes('Emergency') || data.recommendations?.some(r => r.toLowerCase().includes('emergency') || r.toLowerCase().includes('immediate medical attention'));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      
      {/* Emergency Alert Notification (Triage Banner) */}
      {showEmergencyBanner && (
        <Alert
          severity="error"
          icon={<EmergencyIcon sx={{ fontSize: 30 }} />}
          className="pulse-red-glow"
          sx={{
            borderRadius: '16px',
            backgroundColor: 'rgba(220, 38, 38, 0.15)',
            border: '1px solid #dc2626',
            color: '#f87171',
            py: 2,
          }}
        >
          <AlertTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Active Emergency Red Flags Identified</AlertTitle>
          Our triage agents flagged your condition as requiring immediate medical consultation. Please consult a doctor immediately.
          <Button
            size="small"
            color="error"
            variant="outlined"
            onClick={() => navigate('/emergency')}
            sx={{ mt: 1.5, display: 'block', fontWeight: 600, borderColor: '#ef4444' }}
          >
            Review Emergency Instructions
          </Button>
        </Alert>
      )}

      {/* Main Stats Block */}
      <Grid container spacing={4}>
        
        {/* Overall Health Score Card */}
        <Grid item xs={12} md={4}>
          <Card className="glass-panel glass-panel-glow-primary" sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
            <CardContent sx={{ p: 4, width: '100%', textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#94a3b8', mb: 3 }}>
                Overall Health Score
              </Typography>
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={160}
                  thickness={3}
                  sx={{ color: 'rgba(255, 255, 255, 0.04)' }}
                />
                <CircularProgress
                  variant="determinate"
                  value={data.overall_score}
                  size={160}
                  thickness={5}
                  sx={{
                    color: data.overall_score > 75 ? '#10b981' : data.overall_score > 40 ? '#f59e0b' : '#ef4444',
                    position: 'absolute',
                    left: 0,
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                    {data.overall_score}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Points
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: '#94a3b8', px: 2, lineHeight: 1.6 }}>
                Your health score aggregates report analysis, medication schedules, lifestyle logs, and completed goals.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Health Goals and Reminders */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={4} sx={{ height: '100%' }}>
            
            {/* Water Tracker Log */}
            <Grid item xs={12} sm={6}>
              <Card className="glass-panel" sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WaterIcon sx={{ color: '#38bdf8' }} /> Hydration
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Target: 3,000 ml
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#f8fafc' }}>
                      {data.lifestyle.water_ml} <span style={{ fontSize: '1.2rem', fontWeight: 500, color: '#64748b' }}>ml logged</span>
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, (data.lifestyle.water_ml / 3000) * 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '& .MuiLinearProgress-bar': { backgroundColor: '#38bdf8' },
                        mb: 3
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      disabled={waterAddLoading}
                      onClick={() => addWater(250)}
                      startIcon={<AddIcon />}
                      sx={{ borderRadius: '10px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                    >
                      250ml
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      disabled={waterAddLoading}
                      onClick={() => addWater(500)}
                      startIcon={<AddIcon />}
                      sx={{ borderRadius: '10px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                    >
                      500ml
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Sleep and Activity Logs */}
            <Grid item xs={12} sm={6}>
              <Card className="glass-panel" sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ActiveIcon sx={{ color: '#8b5cf6' }} /> Lifestyle Log Today
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SleepIcon sx={{ color: '#a78bfa', fontSize: 32 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Sleep Duration</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {data.lifestyle.sleep_hours} hours <span style={{ fontWeight: 400, color: '#64748b' }}>(Goal: 8h)</span>
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ActiveIcon sx={{ color: '#10b981', fontSize: 32 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Steps Logged</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {data.lifestyle.steps} steps <span style={{ fontWeight: 400, color: '#64748b' }}>(Goal: 10k)</span>
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => navigate('/lifestyle')}
                    endIcon={<ArrowIcon />}
                    sx={{ alignSelf: 'flex-start', color: '#8b5cf6', mt: 1 }}
                  >
                    Log lifestyle details
                  </Button>
                </CardContent>
              </Card>
            </Grid>

          </Grid>
        </Grid>
      </Grid>

      {/* Checklist, Goals, and Reports Bottom Row */}
      <Grid container spacing={4}>
        
        {/* Active Medications Checklist */}
        <Grid item xs={12} md={5}>
          <Card className="glass-panel" sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MedIcon sx={{ color: '#ef4444' }} /> Today's Medications
              </Typography>
              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 2 }} />
              {data.today_medications?.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#64748b', py: 4, textAlign: 'center' }}>
                  No medications scheduled.
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {data.today_medications?.map((med) => {
                    const isLogged = med.logged['morning'] === true; // Check for a sample slot
                    return (
                      <ListItem
                        key={med.id}
                        disablePadding
                        sx={{
                          mb: 1.5,
                          p: 1.5,
                          backgroundColor: 'rgba(255,255,255,0.02)',
                          borderRadius: '10px',
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isLogged}
                              onChange={() => handleMedCheck(med.id, 'morning', isLogged)}
                              sx={{
                                color: 'rgba(255,255,255,0.2)',
                                '&.Mui-checked': { color: '#ef4444' },
                              }}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: isLogged ? '#64748b' : '#f8fafc', textDecoration: isLogged ? 'line-through' : 'none' }}>
                                {med.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748b' }}>
                                Dosage: {med.dosage} | Times: {med.times?.join(', ')}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Health Goals Checklist */}
        <Grid item xs={12} md={7}>
          <Grid container spacing={4} sx={{ height: '100%' }}>
            
            {/* Active Goals Checklist */}
            <Grid item xs={12} sm={6} md={12}>
              <Card className="glass-panel" sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GoalIcon sx={{ color: '#10b981' }} /> Active Health Goals
                  </Typography>
                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 2 }} />
                  {data.active_goals?.length === 0 ? (
                    <Typography variant="body2" sx={{ color: '#64748b', py: 4, textAlign: 'center' }}>
                      No active goals set. Run coordinator chat to auto-generate goals!
                    </Typography>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {data.active_goals?.slice(0, 3).map((goal) => (
                        <ListItem
                          key={goal.id}
                          secondaryAction={
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => handleCompleteGoal(goal.id)}
                              sx={{ borderRadius: '8px', fontSize: '0.75rem' }}
                            >
                              Done
                            </Button>
                          }
                          sx={{
                            mb: 1,
                            backgroundColor: 'rgba(255, 255, 255, 0.01)',
                            borderRadius: '10px',
                            p: 1.5
                          }}
                        >
                          <ListItemText
                            primary={goal.title}
                            secondary={`Period: ${goal.period} | Target: ${goal.target || 'N/A'}`}
                            primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}
                            secondaryTypographyProps={{ fontSize: '0.75rem', color: '#64748b' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Medical Reports summary & Recommendations */}
            <Grid item xs={12} sm={6} md={12}>
              <Card className="glass-panel" sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3, display: 'flex', gap: 3, alignItems: 'center' }}>
                  <ReportIcon sx={{ fontSize: 45, color: '#f59e0b' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Latest Diagnostic Report
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
                      Filename: {data.latest_report?.filename || 'None uploaded'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                      Uploaded: {data.latest_report?.date || 'N/A'}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/reports')}
                    sx={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)', borderRadius: '10px' }}
                  >
                    View
                  </Button>
                </CardContent>
              </Card>
            </Grid>

          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
