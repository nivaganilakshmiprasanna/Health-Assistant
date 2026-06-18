import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import HealthAssessment from './pages/HealthAssessment';
import MedicalReports from './pages/MedicalReports';
import Medications from './pages/Medications';
import NutritionPlans from './pages/NutritionPlans';
import LifestyleTracking from './pages/LifestyleTracking';
import EmergencyAlerts from './pages/EmergencyAlerts';
import ProgressAnalytics from './pages/ProgressAnalytics';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected layout pages */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="assessment" element={<HealthAssessment />} />
          <Route path="reports" element={<MedicalReports />} />
          <Route path="medications" element={<Medications />} />
          <Route path="nutrition" element={<NutritionPlans />} />
          <Route path="lifestyle" element={<LifestyleTracking />} />
          <Route path="emergency" element={<EmergencyAlerts />} />
          <Route path="analytics" element={<ProgressAnalytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
