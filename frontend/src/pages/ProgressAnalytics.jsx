import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Paper,
  Chip
} from '@mui/material';
import {
  TrendingUp as ChartIcon,
  Warning as RiskIcon,
  Lightbulb as TipIcon,
  Timeline as DateIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { analyticsService } from '../services/api';

export default function ProgressAnalytics() {
  const [dashboardData, setDashboardData] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const [dashRes, timeRes] = await Promise.all([
        analyticsService.getDashboardData(),
        analyticsService.getTimelineData()
      ]);
      setDashboardData(dashRes.data);
      setTimelineData(timeRes.data);
    } catch (err) {
      console.error('Failed to load progress analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getRiskLevelColor = (level) => {
    if (level === 'High') return '#ef4444';
    if (level === 'Medium') return '#f59e0b';
    return '#10b981';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={60} sx={{ color: '#38bdf8' }} />
      </Box>
    );
  }

  const risks = dashboardData?.future_risks || [];
  const recommendations = dashboardData?.recommendations || [];

  return (
    <Grid container spacing={4}>
      
      {/* Chart 1: Health Score Trends LineChart */}
      <Grid item xs={12} lg={8}>
        <Card className="glass-panel" sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ChartIcon sx={{ color: '#38bdf8' }} /> Health Timeline Trends
            </Typography>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 3 }} />
            
            {timelineData.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#64748b', py: 10, textAlign: 'center' }}>
                Insufficient data to plot trend line. Please log daily habits or upload medical reports.
              </Typography>
            ) : (
              <Box sx={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timelineData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '0.75rem' }} />
                    <YAxis domain={[0, 100]} stroke="#64748b" style={{ fontSize: '0.75rem' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        color: '#f8fafc'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="overall_score" name="Overall Health" stroke="#38bdf8" strokeWidth={3} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="lifestyle_score" name="Lifestyle Habits" stroke="#10b981" strokeWidth={1.5} />
                    <Line type="monotone" dataKey="medication_score" name="Prescriptions Adherence" stroke="#ef4444" strokeWidth={1.5} />
                    <Line type="monotone" dataKey="reports_score" name="Diagnostic Reports" stroke="#8b5cf6" strokeWidth={1.5} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Right: Future Clinical Risk Predictor */}
      <Grid item xs={12} lg={4}>
        <Card className="glass-panel" sx={{ height: '100%', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: '#f59e0b' }}>
              <RiskIcon /> Future Clinical Risks
            </Typography>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 3 }} />

            {risks.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, py: 6, textAlign: 'center' }}>
                <RiskIcon sx={{ fontSize: 40, color: 'rgba(255, 255, 255, 0.03)', mb: 1 }} />
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Risk profiling requires completed assessments or lab records.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flexGrow: 1, overflowY: 'auto' }}>
                {risks.map((r, idx) => (
                  <Paper
                    key={idx}
                    sx={{
                      p: 2.5,
                      backgroundColor: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '12px'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                        {r.risk_name}
                      </Typography>
                      <Chip
                        label={`${r.risk_level} Risk`}
                        size="small"
                        sx={{
                          backgroundColor: `${getRiskLevelColor(r.risk_level)}15`,
                          color: getRiskLevelColor(r.risk_level),
                          border: `1px solid ${getRiskLevelColor(r.risk_level)}30`,
                          fontWeight: 700,
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem', mb: 1.5, lineHeight: 1.4 }}>
                      <strong>Contributing Factors:</strong> {r.factors}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#10b981', display: 'block', fontWeight: 600 }}>
                      💡 Action Plan: {r.preventive_action}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Chart 2: Habits Tracker BarChart */}
      <Grid item xs={12} md={7}>
        <Card className="glass-panel" sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <DateIcon sx={{ color: '#10b981' }} /> Habit Logging Timelines
            </Typography>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 3 }} />

            {timelineData.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#64748b', py: 10, textAlign: 'center' }}>
                Insufficient logs to display bar timeline.
              </Typography>
            ) : (
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timelineData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '0.75rem' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '0.75rem' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        color: '#f8fafc'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                    <Bar dataKey="steps" name="Steps count" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="water_ml" name="Water (ml)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Bottom: Consolidated Analytics recommendations */}
      <Grid item xs={12} md={5}>
        <Card className="glass-panel" sx={{ height: '100%', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: '#8b5cf6' }}>
              <TipIcon /> Health Architect Recommendations
            </Typography>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 2 }} />

            {recommendations.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#64748b', py: 4, textAlign: 'center' }}>
                No recommendations compiled. Proceed to Health Assessment to prompt agent feedback.
              </Typography>
            ) : (
              <List sx={{ p: 0 }}>
                {recommendations.map((rec, idx) => (
                  <ListItem key={idx} disablePadding sx={{ mb: 2, alignItems: 'flex-start' }}>
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
            )}
          </CardContent>
        </Card>
      </Grid>

    </Grid>
  );
}
