import { baseURL } from '@/services/config';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Shield, 
  BarChart3, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Settings, 
  FileText, 
  BookOpen, 
  Headphones,
  Activity,
  Globe,
  Server,
  Database
} from 'lucide-react';

// Main application configuration
export const appConfig = {
  company: {
    name: 'Tiffix by Futuredesks',
    fullName: 'Tiffix API Status',
    tagline: 'Healthy Meal just like Home',
    description: 'Comprehensive overview of our trading platform services and endpoints',
    uptimeTarget: '99.9%'
  },

  api: {
    baseURL: baseURL,
    healthCheckInterval: 30000, 
    version: 'v1'
  },

  // Theme Configuration
  theme: {
    primaryColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'black',
    cardBackground: 'gray-900/50',
    borderColor: 'gray-700/50'
  },

  services: [
    {
      id: 'health',
      name: 'System Health',
      icon: Activity,
      color: 'from-white to-gray-200',
      healthEndpoint: '/health',
      description: 'Core system monitoring and self-check functionality',
      endpoints: [
        'Service Self-Check', 
        'General Health Status'
      ]
    },
  ],

  statusMessages: {
    checking: 'Checking system status...',
    allOperational: 'All systems operational',
    partialOutage: 'Some services experiencing issues',
    majorOutage: 'Multiple services down',
    unknown: 'System status unknown'
  },

  monitoring: {
    realTimeUpdates: 'Status refreshes every 30 seconds',
    serviceCoverage: 'Complete trading platform ecosystem'
  },
  healthDisplay: {
    showDetailedMetrics: true,
    showSystemInfo: true,
    showApplicationInfo: true,
    metricsToShow: {
      uptime: true,
      memoryUsage: true,
      cpuUsage: true,
      environment: true,
      responseTime: true
    }
  }
};

export const getTotalEndpoints = () => {
  return appConfig.services.reduce((total, service) => total + service.endpoints.length, 0);
};

export const buildApiUrl = (endpoint) => {
  return `${appConfig.api.baseURL}/${appConfig.api.version}${endpoint}`;
};