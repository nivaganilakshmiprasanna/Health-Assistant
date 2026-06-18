import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Grid,
  TextField,
  Button,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper
} from '@mui/material';
import {
  Send as SendIcon,
  AssignmentInd as ProfileIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { profileService, coordinatorService } from '../services/api';

// Simple basic markdown renderer function for final recommendations
const renderMarkdown = (text) => {
  if (!text) return null;

  // Helper to parse inline markdown (bolding **text**) and clean HTML tags
  const parseInline = (rawText) => {
    // 1. Strip basic HTML tags that might leak through (e.g. <font>, </font>)
    let cleaned = rawText.replace(/<font[^>]*>/g, '').replace(/<\/font>/g, '');
    cleaned = cleaned.replace(/<[^>]+>/g, ''); // Strip any other HTML tags for safety

    // 2. Parse **bold** markers
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    boldRegex.lastIndex = 0;
    while ((match = boldRegex.exec(cleaned)) !== null) {
      if (match.index > lastIndex) {
        parts.push(cleaned.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} style={{ color: '#fff', fontWeight: 600 }}>{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }

    if (lastIndex < cleaned.length) {
      parts.push(cleaned.substring(lastIndex));
    }

    return parts.length > 0 ? parts : cleaned;
  };

  return text.split('\n').map((line, idx) => {
    const trimmedLine = line.trim();

    // Horizontal Rule
    if (trimmedLine === '---') {
      return <Divider key={idx} sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.08)' }} />;
    }

    // Headers
    if (trimmedLine.startsWith('# ')) {
      return (
        <Typography key={idx} variant="h4" sx={{ fontWeight: 800, mt: 4, mb: 2, color: '#f8fafc' }}>
          {parseInline(trimmedLine.substring(2))}
        </Typography>
      );
    }
    if (trimmedLine.startsWith('## ')) {
      return (
        <Typography key={idx} variant="h5" sx={{ fontWeight: 700, mt: 3, mb: 1.5, color: '#8b5cf6' }}>
          {parseInline(trimmedLine.substring(3))}
        </Typography>
      );
    }
    if (trimmedLine.startsWith('### ')) {
      return (
        <Typography key={idx} variant="h6" sx={{ fontWeight: 700, mt: 2.5, mb: 1, color: '#38bdf8' }}>
          {parseInline(trimmedLine.substring(4))}
        </Typography>
      );
    }
    if (trimmedLine.startsWith('#### ')) {
      return (
        <Typography key={idx} variant="subtitle1" sx={{ fontWeight: 700, mt: 2, mb: 1, color: '#38bdf8' }}>
          {parseInline(trimmedLine.substring(5))}
        </Typography>
      );
    }

    // Blockquote
    if (trimmedLine.startsWith('> ')) {
      const isWarning = trimmedLine.toLowerCase().includes('warning') || trimmedLine.toLowerCase().includes('emergency') || trimmedLine.toLowerCase().includes('alert');
      return (
        <Box 
          key={idx} 
          sx={{ 
            pl: 2, 
            py: 1, 
            pr: 1,
            my: 2, 
            borderLeft: isWarning ? '4px solid #f43f5e' : '4px solid #8b5cf6', 
            backgroundColor: isWarning ? 'rgba(244, 63, 94, 0.06)' : 'rgba(139, 92, 246, 0.06)',
            borderRadius: '4px'
          }}
        >
          <Typography variant="body2" sx={{ color: isWarning ? '#fda4af' : '#c084fc', lineHeight: 1.6 }}>
            {parseInline(trimmedLine.substring(2))}
          </Typography>
        </Box>
      );
    }

    // List Items (Bullet, Indented Bullet, and Numbered list support)
    const bulletMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
    if (bulletMatch) {
      const indent = bulletMatch[1].length;
      const content = bulletMatch[3];
      return (
        <Typography 
          key={idx} 
          variant="body2" 
          sx={{ 
            ml: 2 + indent * 1.5, 
            mb: 0.75, 
            display: 'list-item', 
            listStyleType: bulletMatch[2].includes('.') ? 'decimal' : 'disc',
            color: '#e6edf3', 
            lineHeight: 1.6
          }}
        >
          {parseInline(content)}
        </Typography>
      );
    }

    // Skip rendering spacing for empty lines to keep block spacing neat
    if (trimmedLine === '') {
      return <Box key={idx} sx={{ height: '8px' }} />;
    }

    // Default Paragraph text
    return (
      <Typography key={idx} variant="body2" sx={{ mb: 1.5, lineHeight: 1.6, color: '#94a3b8' }}>
        {parseInline(line)}
      </Typography>
    );
  });
};

export default function HealthAssessment() {
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    gender: 'Male',
    occupation: '',
    medical_history: {
      diabetes: false,
      hypertension: false,
      thyroid: false,
      anemia: false,
      asthma: false,
      other: ''
    }
  });

  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch user profile if it exists
    profileService.getProfile()
      .then((res) => {
        const p = res.data;
        setProfile({
          name: p.name,
          age: p.age,
          gender: p.gender,
          occupation: p.occupation || '',
          medical_history: p.medical_history || {
            diabetes: false,
            hypertension: false,
            thyroid: false,
            anemia: false,
            asthma: false,
            other: ''
          }
        });
      })
      .catch((err) => {
        console.log('No profile exists yet. Create one.');
      })
      .finally(() => {
        setFetchingProfile(false);
      });
  }, []);

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleHistoryChange = (field, checked) => {
    setProfile(prev => ({
      ...prev,
      medical_history: {
        ...prev.medical_history,
        [field]: checked
      }
    }));
  };

  const handleSubmitAssessment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // 1. Save Profile Details
      await profileService.updateProfile({
        name: profile.name,
        age: parseInt(profile.age),
        gender: profile.gender,
        occupation: profile.occupation,
        medical_history: profile.medical_history
      });

      // 2. Trigger Coordinator Agent coordination
      const coordinateRes = await coordinatorService.coordinate(symptoms || 'Generate initial health profile assessment.');
      setFeedback(coordinateRes.data.response);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Assessment processing failed. Check inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={60} sx={{ color: '#38bdf8' }} />
      </Box>
    );
  }

  return (
    <Grid container spacing={4}>
      {/* Questionnaire Form */}
      <Grid item xs={12} lg={5}>
        <Card className="glass-panel" sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ProfileIcon sx={{ color: '#38bdf8' }} /> Health Intake Form
            </Typography>

            <form onSubmit={handleSubmitAssessment}>
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <TextField
                    className="glass-input"
                    label="Patient Full Name"
                    variant="outlined"
                    fullWidth
                    required
                    value={profile.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    sx={{ '& label': { color: '#64748b' }, '& label.Mui-focused': { color: '#38bdf8' } }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    className="glass-input"
                    label="Age"
                    type="number"
                    variant="outlined"
                    fullWidth
                    required
                    value={profile.age}
                    onChange={(e) => handleProfileChange('age', e.target.value)}
                    sx={{ '& label': { color: '#64748b' }, '& label.Mui-focused': { color: '#38bdf8' } }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    className="glass-input"
                    label="Occupation"
                    type="text"
                    variant="outlined"
                    fullWidth
                    value={profile.occupation}
                    onChange={(e) => handleProfileChange('occupation', e.target.value)}
                    sx={{ '& label': { color: '#64748b' }, '& label.Mui-focused': { color: '#38bdf8' } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormLabel sx={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', mb: 1 }}>Gender</FormLabel>
                  <RadioGroup
                    row
                    value={profile.gender}
                    onChange={(e) => handleProfileChange('gender', e.target.value)}
                    sx={{ color: '#f8fafc' }}
                  >
                    <FormControlLabel value="Male" control={<Radio sx={{ color: 'rgba(255,255,255,0.2)', '&.Mui-checked': { color: '#38bdf8' } }} />} label="Male" />
                    <FormControlLabel value="Female" control={<Radio sx={{ color: 'rgba(255,255,255,0.2)', '&.Mui-checked': { color: '#38bdf8' } }} />} label="Female" />
                    <FormControlLabel value="Other" control={<Radio sx={{ color: 'rgba(255,255,255,0.2)', '&.Mui-checked': { color: '#38bdf8' } }} />} label="Other" />
                  </RadioGroup>
                </Grid>

                <Grid item xs={12}>
                  <FormLabel sx={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', mb: 1.5 }}>
                    Medical Conditions History
                  </FormLabel>
                  <Grid container spacing={1}>
                    {['diabetes', 'hypertension', 'thyroid', 'anemia', 'asthma'].map((cond) => (
                      <Grid item xs={6} key={cond}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={profile.medical_history[cond] || false}
                              onChange={(e) => handleHistoryChange(cond, e.target.checked)}
                              sx={{ color: 'rgba(255,255,255,0.2)', '&.Mui-checked': { color: '#8b5cf6' } }}
                            />
                          }
                          label={<Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{cond}</Typography>}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    className="glass-input"
                    label="Other History / Notes"
                    multiline
                    rows={2}
                    variant="outlined"
                    fullWidth
                    value={profile.medical_history.other || ''}
                    onChange={(e) => handleHistoryChange('other', e.target.value)}
                    sx={{ '& label': { color: '#64748b' }, '& label.Mui-focused': { color: '#38bdf8' } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    className="glass-input"
                    label="Describe Symptoms (e.g. 'I feel tired and weak, and have a mild headache since morning')"
                    multiline
                    rows={4}
                    variant="outlined"
                    fullWidth
                    required
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    sx={{ '& label': { color: '#64748b' }, '& label.Mui-focused': { color: '#38bdf8' } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} sx={{ color: '#0a0f1d' }} /> : <SendIcon />}
                    sx={{
                      py: 1.5,
                      borderRadius: '12px',
                      backgroundColor: '#38bdf8',
                      color: '#0a0f1d',
                      fontWeight: 700,
                      '&:hover': { backgroundColor: '#0ea5e9' }
                    }}
                  >
                    {loading ? 'Processing Assessment...' : 'Submit Assessment'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grid>

      {/* Coordination Insights Dashboard Output */}
      <Grid item xs={12} lg={7}>
        <Card className="glass-panel" sx={{ height: '100%', minHeight: 600 }}>
          <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ChatIcon sx={{ color: '#8b5cf6' }} /> Multi-Agent Coordinated Recommendations
            </Typography>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 3 }} />

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

            {feedback ? (
              <Box sx={{ overflowY: 'auto', flexGrow: 1, pr: 1 }}>
                {renderMarkdown(feedback)}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, py: 10, textAlign: 'center' }}>
                <ProfileIcon sx={{ fontSize: 70, color: 'rgba(255, 255, 255, 0.04)', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#64748b', maxAlign: 400 }}>
                  Enter your health credentials and current symptoms, and click "Submit Assessment" to invoke our multi-agent healthcare coordinator.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
