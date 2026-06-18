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
  Checkbox,
  FormGroup,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  List,
  ListItem
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckedIcon,
  Cancel as MissedIcon,
  LocalHospital as MedIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { medicationsService } from '../services/api';

export default function Medications() {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [scheduleSlots, setScheduleSlots] = useState({
    morning: true,
    afternoon: false,
    evening: false,
    night: true
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [prescriptionUploading, setPrescriptionUploading] = useState(false);
  const [extractedMedications, setExtractedMedications] = useState(null);

  const fetchMedications = async () => {
    try {
      const res = await medicationsService.getMedications();
      setMeds(res.data);
    } catch (err) {
      console.error('Failed to load medications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrescriptionFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      handlePrescriptionUpload(file);
    }
  };

  const handlePrescriptionUpload = async (file) => {
    setError('');
    setSuccess('');
    setPrescriptionUploading(true);
    setExtractedMedications(null);
    try {
      const res = await medicationsService.uploadPrescription(file);
      const extracted = res.data.extracted_medications || [];
      if (extracted.length === 0) {
        setError('No medications could be extracted from this prescription file.');
      } else {
        setSuccess(`Successfully analyzed prescription. Found ${extracted.length} medications! Please review and set tracker below.`);
        setExtractedMedications(extracted);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to extract prescription details. Please add manually.');
    } finally {
      setPrescriptionUploading(false);
    }
  };

  const handleSetTracker = async () => {
    if (!extractedMedications || extractedMedications.length === 0) return;
    setError('');
    setSuccess('');
    setPrescriptionUploading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const medsWithStartDate = extractedMedications.map(med => ({
        ...med,
        start_date: todayStr
      }));
      await medicationsService.addMedicationsBulk(medsWithStartDate);
      setSuccess(`Successfully added ${extractedMedications.length} medications to tracker!`);
      setExtractedMedications(null);
      fetchMedications();
    } catch (err) {
      setError('Failed to save extracted medications to tracker.');
    } finally {
      setPrescriptionUploading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const handleCheckboxChange = (slot) => {
    setScheduleSlots(prev => ({
      ...prev,
      [slot]: !prev[slot]
    }));
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Compile schedule slots list
    const times = [];
    if (scheduleSlots.morning) times.push('morning');
    if (scheduleSlots.afternoon) times.push('afternoon');
    if (scheduleSlots.evening) times.push('evening');
    if (scheduleSlots.night) times.push('night');

    if (times.length === 0) {
      setError('Please select at least one daily schedule slot.');
      return;
    }

    try {
      await medicationsService.addMedication({
        name,
        dosage,
        schedule: { times },
        start_date: new Date().toISOString().split('T')[0]
      });
      setSuccess('Medication added successfully.');
      setName('');
      setDosage('');
      fetchMedications();
    } catch (err) {
      setError('Failed to create medication prescription.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await medicationsService.deleteMedication(id);
      fetchMedications();
    } catch (err) {
      console.error('Failed to delete medication:', err);
    }
  };

  const toggleAdherence = async (medId, dateStr, timeSlot, currentStatus) => {
    try {
      await medicationsService.logAdherence(medId, dateStr, timeSlot, !currentStatus);
      fetchMedications();
    } catch (err) {
      console.error('Failed to toggle medication log:', err);
    }
  };

  // Generate date strings for the past 5 days for the interactive tracking grid
  const getTrackingDates = () => {
    const dates = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push({
        dateStr: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate()
      });
    }
    return dates;
  };

  const trackingDates = getTrackingDates();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={60} sx={{ color: '#38bdf8' }} />
      </Box>
    );
  }

  return (
    <Grid container spacing={4}>
      
      {/* Left: Add Medication Form */}
      <Grid item xs={12} lg={4}>
        <Card className="glass-panel" sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <MedIcon sx={{ color: '#ef4444' }} /> Add Prescription
            </Typography>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 3 }} />

            {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px' }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2.5, borderRadius: '10px' }}>{success}</Alert>}

            {extractedMedications ? (
              <Box sx={{ mt: 1, mb: 2.5 }}>
                <Typography variant="subtitle2" sx={{ color: '#f8fafc', fontWeight: 700, mb: 1.5 }}>
                  🔍 Extracted Medications:
                </Typography>
                <List sx={{ p: 0, mb: 2.5 }}>
                  {extractedMedications.map((m, idx) => (
                    <ListItem
                      key={idx}
                      disablePadding
                      sx={{
                        p: 2,
                        mb: 1.5,
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#e6edf3' }}>
                        💊 {m.name} ({m.dosage})
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
                        <strong>When to use:</strong> {m.schedule.times.join(', ')}
                      </Typography>
                    </ListItem>
                  ))}
                </List>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleSetTracker}
                    disabled={prescriptionUploading}
                    sx={{
                      py: 1.2,
                      borderRadius: '10px',
                      backgroundColor: '#10b981',
                      color: '#f8fafc',
                      fontWeight: 700,
                      '&:hover': { backgroundColor: '#059669' }
                    }}
                  >
                    Set Tracker
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setExtractedMedications(null)}
                    sx={{
                      py: 1.2,
                      borderRadius: '10px',
                      borderColor: 'rgba(255,255,255,0.1)',
                      color: '#94a3b8',
                      '&:hover': { borderColor: 'rgba(255,255,255,0.2)', color: '#f8fafc' }
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <>
                {/* Upload Prescription */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed rgba(239, 68, 68, 0.2)',
                    borderRadius: '12px',
                    p: 2.5,
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.01)',
                    '&:hover': { borderColor: '#ef4444' },
                    cursor: 'pointer',
                    mb: 2.5
                  }}
                  component="label"
                >
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handlePrescriptionFileChange}
                    disabled={prescriptionUploading}
                  />
                  {prescriptionUploading ? (
                    <CircularProgress size={30} sx={{ color: '#ef4444', mb: 1 }} />
                  ) : (
                    <UploadIcon sx={{ fontSize: 32, color: '#64748b', mb: 1 }} />
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#94a3b8' }}>
                    {prescriptionUploading ? 'Analyzing Prescription...' : 'Upload Prescription File'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                    PDF or Image (AI will extract medications)
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                  <Divider sx={{ flexGrow: 1, borderColor: 'rgba(255, 255, 255, 0.06)' }} />
                  <Typography variant="caption" sx={{ px: 2, color: '#64748b', fontWeight: 600 }}>
                    OR ADD MANUALLY
                  </Typography>
                  <Divider sx={{ flexGrow: 1, borderColor: 'rgba(255, 255, 255, 0.06)' }} />
                </Box>
              </>
            )}

            <form onSubmit={handleAddMedication}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                
                <TextField
                  className="glass-input"
                  label="Medication Name (e.g. Metformin)"
                  variant="outlined"
                  fullWidth
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  sx={{ '& label': { color: '#64748b' }, '& label.Mui-focused': { color: '#38bdf8' } }}
                />

                <TextField
                  className="glass-input"
                  label="Dosage Strength (e.g. 500mg)"
                  variant="outlined"
                  fullWidth
                  required
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  sx={{ '& label': { color: '#64748b' }, '& label.Mui-focused': { color: '#38bdf8' } }}
                />

                <Box>
                  <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1, fontWeight: 500 }}>
                    Intake Schedule Slots
                  </Typography>
                  <FormGroup row>
                    {['morning', 'afternoon', 'evening', 'night'].map((slot) => (
                      <FormControlLabel
                        key={slot}
                        control={
                          <Checkbox
                            checked={scheduleSlots[slot]}
                            onChange={() => handleCheckboxChange(slot)}
                            sx={{ color: 'rgba(255,255,255,0.2)', '&.Mui-checked': { color: '#ef4444' } }}
                          />
                        }
                        label={<Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{slot}</Typography>}
                      />
                    ))}
                  </FormGroup>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  startIcon={<AddIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: '11px',
                    backgroundColor: '#ef4444',
                    color: '#f8fafc',
                    fontWeight: 700,
                    '&:hover': { backgroundColor: '#dc2626' }
                  }}
                >
                  Add Medication
                </Button>

              </Box>
            </form>
          </CardContent>
        </Card>
      </Grid>

      {/* Right: Prescriptions and Logs Grid */}
      <Grid item xs={12} lg={8}>
        <Card className="glass-panel" sx={{ height: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Prescriptions & Intake Adherence Tracker
            </Typography>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 3 }} />

            {meds.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, textAlign: 'center' }}>
                <MedIcon sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.03)', mb: 2 }} />
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  No active prescriptions. Populate the form to add medications.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {meds.map((med) => {
                  let schedule = {};
                  try {
                    schedule = typeof med.schedule === 'string' ? JSON.parse(med.schedule) : med.schedule;
                  } catch (e) {
                    schedule = med.schedule;
                  }

                  const activeTimes = schedule.times || [];

                  return (
                    <Paper
                      key={med.id}
                      sx={{
                        p: 3,
                        backgroundColor: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        position: 'relative'
                      }}
                    >
                      {/* Prescriptions header details */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                            {med.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
                            Dosage: {med.dosage} | Scheduled slots: {activeTimes.join(', ')}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(med.id)}
                          sx={{ color: '#64748b', '&:hover': { color: '#ef4444' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.04)', mb: 2.5 }} />

                      {/* Log Grid */}
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5, fontWeight: 600 }}>
                        CLICK CELL TO LOG INTAKE FOR PAST 5 DAYS
                      </Typography>
                      <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <Table size="small">
                          <TableHead sx={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                            <TableRow>
                              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.8rem' }}>Slot</TableCell>
                              {trackingDates.map((td) => (
                                <TableCell key={td.dateStr} align="center" sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.8rem' }}>
                                  {td.dayName} {td.dayNum}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {activeTimes.map((slot) => (
                              <TableRow key={slot}>
                                <TableCell sx={{ color: '#e6edf3', textTransform: 'capitalize', fontWeight: 500, fontSize: '0.8rem' }}>
                                  {slot}
                                </TableCell>
                                {trackingDates.map((td) => {
                                  // Parse logs
                                  let logs = {};
                                  try {
                                    logs = typeof med.adherence_logs === 'string' ? JSON.parse(med.adherence_logs) : med.adherence_logs;
                                  } catch (e) {
                                    logs = med.adherence_logs;
                                  }
                                  const isTaken = logs[td.dateStr]?.[slot] === true;

                                  return (
                                    <TableCell key={td.dateStr} align="center" sx={{ py: 1 }}>
                                      <IconButton
                                        size="small"
                                        onClick={() => toggleAdherence(med.id, td.dateStr, slot, isTaken)}
                                        sx={{
                                          color: isTaken ? '#10b981' : 'rgba(255,255,255,0.05)',
                                          backgroundColor: isTaken ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                                          '&:hover': {
                                            backgroundColor: isTaken ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)'
                                          }
                                        }}
                                      >
                                        {isTaken ? <CheckedIcon fontSize="small" /> : <MissedIcon fontSize="small" />}
                                      </IconButton>
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  );
                })}
              </Box>
            )}

          </CardContent>
        </Card>
      </Grid>

    </Grid>
  );
}
