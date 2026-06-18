import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: '', // Relies on Vite proxy during development, or direct URL in production
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token if stored
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry / unauthenticated states
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login if on a protected route and not already on login
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API Endpoint Wrapper Functions
export const authService = {
  register: (username, email, password) => 
    api.post('/api/auth/register', { username, email, password }),
  
  login: (email, password) => 
    api.post('/api/auth/login', { email, password }),
    
  getCurrentUser: () => 
    api.get('/api/auth/me'),
};

export const profileService = {
  getProfile: () => 
    api.get('/api/profile'),
    
  updateProfile: (profileData) => 
    api.post('/api/profile', profileData),
};

export const coordinatorService = {
  coordinate: (message, symptoms = null) => 
    api.post('/api/coordinate', { message, symptoms }),
    
  processVoice: (transcript) => 
    api.post('/api/voice/process', { message: transcript }),
};

export const reportsService = {
  uploadReport: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/reports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  getReports: () => 
    api.get('/api/reports'),
};

export const medicationsService = {
  getMedications: () => 
    api.get('/api/medications'),
    
  addMedication: (medData) => 
    api.post('/api/medications', medData),
    
  logAdherence: (id, logDate, timeSlot, status) => 
    api.post(`/api/medications/${id}/log`, { log_date: logDate, time_slot: timeSlot, status }),
    
  deleteMedication: (id) => 
    api.delete(`/api/medications/${id}`),

  uploadPrescription: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/medications/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  addMedicationsBulk: (meds) => 
    api.post('/api/medications/bulk', meds),
};

export const lifestyleService = {
  getLogs: (startDate = null, endDate = null) => 
    api.get('/api/lifestyle', { params: { start_date: startDate, end_date: endDate } }),
    
  getTodayLog: () => 
    api.get('/api/lifestyle/today'),
    
  logLifestyle: (logData) => 
    api.post('/api/lifestyle', logData),
};

export const goalsService = {
  getGoals: () => 
    api.get('/api/goals'),
    
  createGoal: (goalData) => 
    api.post('/api/goals', goalData),
    
  updateGoal: (id, currentVal, status = null) => 
    api.put(`/api/goals/${id}`, { current_value: currentVal, status }),
};

export const analyticsService = {
  getDashboardData: () => 
    api.get('/api/analytics/dashboard'),
    
  getTimelineData: () => 
    api.get('/api/analytics/timeline'),
};

export default api;
