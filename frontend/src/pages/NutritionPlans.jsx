import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Button,
  Chip
} from '@mui/material';
import {
  Restaurant as DietIcon,
  CheckCircle as IncludeIcon,
  Cancel as AvoidIcon,
  Lightbulb as TipIcon,
  Alarm as TimeIcon
} from '@mui/icons-material';
import { analyticsService } from '../services/api';

export default function NutritionPlans() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNutritionData = async () => {
    try {
      const res = await analyticsService.getDashboardData();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load nutrition plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNutritionData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={60} sx={{ color: '#38bdf8' }} />
      </Box>
    );
  }

  const nutrition = data?.nutrition_plan || {};
  const hasPlan = nutrition.meals && Object.keys(nutrition.meals).length > 0;

  return (
    <Box>
      {!hasPlan ? (
        <Card className="glass-panel" sx={{ py: 8, px: 3, textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <DietIcon sx={{ fontSize: 70, color: 'rgba(255, 255, 255, 0.04)', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#f8fafc' }}>
            No Nutrition Blueprint Found
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', maxAlign: 500, mx: 'auto', mb: 3 }}>
            To generate a personalized, disease-specific diet plan with local Indian food options, please complete your Health Assessment Profile first.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/assessment')}
            sx={{ backgroundColor: '#38bdf8', color: '#0a0f1d', fontWeight: 700, px: 4, py: 1.2, borderRadius: '10px' }}
          >
            Start Health Assessment
          </Button>
        </Card>
      ) : (
        <Grid container spacing={4}>
          
          {/* Header Card */}
          <Grid item xs={12}>
            <Card className="glass-panel" sx={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <CardContent sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981'
                  }}
                >
                  <DietIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Active Dietary Profile
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc', mt: 0.5 }}>
                    {nutrition.diet_type || 'Custom Balanced Diet'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Left Side: Daily Meal Planner Timeline */}
          <Grid item xs={12} md={7}>
            <Card className="glass-panel" sx={{ height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  Daily Indian Meal Planner
                </Typography>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 3 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                  {Object.entries(nutrition.meals || {}).map(([key, desc]) => {
                    // Prettify meal name
                    const title = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    return (
                      <Box key={key} sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                        <Box
                          sx={{
                            p: 1.2,
                            borderRadius: '10px',
                            backgroundColor: 'rgba(56, 189, 248, 0.05)',
                            color: '#38bdf8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <TimeIcon fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#e6edf3' }}>
                            {title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5, lineHeight: 1.5 }}>
                            {desc}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Side: Include, Avoid and Recommendations */}
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              
              {/* Foods to Include & Avoid */}
              <Card className="glass-panel">
                <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                  
                  {/* Foods to Include */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <IncludeIcon fontSize="small" /> Recommended Foods
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {nutrition.foods_to_include?.map((food, idx) => (
                        <Chip
                          key={idx}
                          label={food}
                          sx={{
                            backgroundColor: 'rgba(16, 185, 129, 0.05)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            fontWeight: 500,
                            borderRadius: '8px'
                          }}
                        />
                      ))}
                    </Box>
                  </Box>

                  {/* Foods to Avoid */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <AvoidIcon fontSize="small" /> Foods to Limit / Avoid
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {nutrition.foods_to_avoid?.map((food, idx) => (
                        <Chip
                          key={idx}
                          label={food}
                          sx={{
                            backgroundColor: 'rgba(239, 68, 68, 0.05)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            fontWeight: 500,
                            borderRadius: '8px'
                          }}
                        />
                      ))}
                    </Box>
                  </Box>

                </CardContent>
              </Card>

              {/* Recommendations list */}
              <Card className="glass-panel">
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                    <TipIcon fontSize="small" /> Dietitian Advice
                  </Typography>
                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 2 }} />
                  
                  <List sx={{ p: 0 }}>
                    {nutrition.recommendations?.map((rec, idx) => (
                      <ListItem key={idx} disablePadding sx={{ mb: 1.5, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 28, color: '#8b5cf6', mt: 0.2 }}>
                          <TipIcon sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={rec}
                          primaryTypographyProps={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>

            </Box>
          </Grid>

        </Grid>
      )}
    </Box>
  );
}
