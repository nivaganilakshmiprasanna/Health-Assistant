import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as ReportIcon,
  Warning as WarnIcon,
  CheckCircle as GoodIcon,
  Timeline as TrendIcon
} from '@mui/icons-material';
import { reportsService } from '../services/api';

export default function MedicalReports() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchReports = async () => {
    try {
      const res = await reportsService.getReports();
      setReports(res.data);
      if (res.data.length > 0 && !selectedReport) {
        setSelectedReport(res.data[0]); // Default to latest report
      }
    } catch (err) {
      console.error('Failed to load reports history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
      setSuccess('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF or Image file to upload.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const res = await reportsService.uploadReport(file);
      setSuccess('Report uploaded and analyzed successfully!');
      setFile(null);
      
      // Refresh list and make newly uploaded report selected
      const listRes = await reportsService.getReports();
      setReports(listRes.data);
      setSelectedReport(listRes.data[0]);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Report OCR/analysis failed. Check file type.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={60} sx={{ color: '#38bdf8' }} />
      </Box>
    );
  }

  // Parse details for selected report
  let analysis = {};
  if (selectedReport && selectedReport.analysis_result) {
    try {
      analysis = typeof selectedReport.analysis_result === 'string'
        ? JSON.parse(selectedReport.analysis_result)
        : selectedReport.analysis_result;
    } catch (err) {
      analysis = selectedReport.analysis_result;
    }
  }

  return (
    <Grid container spacing={4}>
      
      {/* Upload & History Left Sidebar */}
      <Grid item xs={12} md={4}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          
          {/* Upload Card */}
          <Card className="glass-panel" sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#f8fafc' }}>
                Upload Lab Report
              </Typography>
              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 2.5 }} />
              
              {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }}>{success}</Alert>}
              
              <form onSubmit={handleUpload}>
                <Box
                  sx={{
                    border: '2px dashed rgba(56, 189, 248, 0.2)',
                    borderRadius: '12px',
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.01)',
                    '&:hover': { borderColor: '#38bdf8' },
                    cursor: 'pointer',
                    mb: 2.5
                  }}
                  component="label"
                >
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                  />
                  <UploadIcon sx={{ fontSize: 40, color: '#64748b', mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#94a3b8' }}>
                    {file ? file.name : 'Select Report PDF or Image'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                    Accepts PDF, PNG, JPG, JPEG
                  </Typography>
                </Box>
                
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={uploading || !file}
                  startIcon={uploading && <CircularProgress size={20} sx={{ color: '#0a0f1d' }} />}
                  sx={{
                    py: 1.2,
                    borderRadius: '10px',
                    backgroundColor: '#38bdf8',
                    color: '#0a0f1d',
                    fontWeight: 700,
                    '&:hover': { backgroundColor: '#0ea5e9' }
                  }}
                >
                  {uploading ? 'Extracting & Analyzing...' : 'Upload & Analyze'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* History List Card */}
          <Card className="glass-panel">
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#f8fafc' }}>
                Diagnostic History
              </Typography>
              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 2 }} />
              
              {reports.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', py: 4 }}>
                  No reports uploaded yet.
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {reports.map((report) => (
                    <ListItem
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      sx={{
                        borderRadius: '10px',
                        cursor: 'pointer',
                        mb: 1.5,
                        backgroundColor: selectedReport?.id === report.id ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.02)',
                        border: '1px solid',
                        borderColor: selectedReport?.id === report.id ? 'rgba(56, 189, 248, 0.3)' : 'transparent',
                        color: selectedReport?.id === report.id ? '#38bdf8' : '#94a3b8',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <ListItemText
                        primary={report.filename}
                        secondary={new Date(report.created_at).toLocaleDateString()}
                        primaryTypographyProps={{ fontWeight: 600, color: selectedReport?.id === report.id ? '#f8fafc' : '#e6edf3', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                        secondaryTypographyProps={{ color: '#64748b', fontSize: '0.75rem' }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

        </Box>
      </Grid>

      {/* Analysis Details Panel Right */}
      <Grid item xs={12} md={8}>
        {selectedReport ? (
          <Card className="glass-panel" sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <CardContent sx={{ p: 4 }}>
              
              {/* Header Title */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                    {selectedReport.filename}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                    Processed on {new Date(selectedReport.created_at).toLocaleString()}
                  </Typography>
                </Box>
                <Chip
                  icon={<ReportIcon />}
                  label="Analyzed"
                  color="success"
                  variant="outlined"
                  sx={{ borderRadius: '8px', fontWeight: 600 }}
                />
              </Box>
              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 3 }} />

              {/* Lab Summary */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#38bdf8', mb: 1 }}>
                  Clinical Summary
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
                  {analysis.summary || 'Summary details unavailable.'}
                </Typography>
              </Box>

              {/* Abnormal Findings Table */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ef4444', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarnIcon fontSize="small" /> Parameter Abnormalities & Flags
                </Typography>
                {analysis.abnormalities?.length === 0 ? (
                  <Alert severity="success" sx={{ borderRadius: '12px' }}>
                    No critical abnormalities were flagged in this report. All parameters are within reference range boundaries.
                  </Alert>
                ) : (
                  <TableContainer component={Paper} sx={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                    <Table>
                      <TableHead sx={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                        <TableRow>
                          <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }}>Parameter</TableCell>
                          <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }}>Value</TableCell>
                          <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }}>Ref Range</TableCell>
                          <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analysis.abnormalities?.map((ab, idx) => (
                          <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ color: '#f8fafc', fontWeight: 600 }}>{ab.parameter}</TableCell>
                            <TableCell sx={{ color: '#ef4444', fontWeight: 600 }}>{ab.value}</TableCell>
                            <TableCell sx={{ color: '#64748b' }}>{ab.reference_range}</TableCell>
                            <TableCell>
                              <Chip
                                label={ab.status}
                                size="small"
                                color="error"
                                variant="outlined"
                                sx={{ borderRadius: '6px', fontWeight: 700, fontSize: '0.7rem' }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>

              {/* Insights bullet points */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#8b5cf6', mb: 1.5 }}>
                  Key Recommendations & Diagnostics
                </Typography>
                <List sx={{ p: 0 }}>
                  {analysis.insights?.map((insight, idx) => (
                    <ListItem key={idx} disablePadding sx={{ mb: 1, display: 'list-item', ml: 2, color: '#94a3b8', listStyleType: 'disc' }}>
                      <ListItemText primary={insight} primaryTypographyProps={{ fontSize: '0.875rem' }} />
                    </ListItem>
                  ))}
                </List>
              </Box>

              {/* Trends comparison */}
              {analysis.trends && (
                <Box sx={{ mb: 4, p: 2, backgroundColor: 'rgba(139, 92, 246, 0.03)', borderLeft: '3px solid #8b5cf6', borderRadius: '4px' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <TrendIcon fontSize="small" /> Historical Diagnostic Trends
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.5 }}>
                    {analysis.trends}
                  </Typography>
                </Box>
              )}

              {/* Raw extracted text accordion/expand */}
              <Box sx={{ mt: 5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#64748b', mb: 1.5 }}>
                  Raw Transcribed Text
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    maxHeight: 250,
                    overflowY: 'auto',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    fontFamily: 'Courier New, monospace',
                    fontSize: '0.75rem',
                    color: '#64748b',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {selectedReport.extracted_text || 'No text extracted.'}
                </Paper>
              </Box>

            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 15, textAlign: 'center' }}>
            <ReportIcon sx={{ fontSize: 90, color: 'rgba(255,255,255,0.03)', mb: 2 }} />
            <Typography variant="body1" sx={{ color: '#64748b' }}>
              Select a medical report from the sidebar diagnostic history, or upload a new report to trigger multi-agent analysis.
            </Typography>
          </Box>
        )}
      </Grid>

    </Grid>
  );
}
