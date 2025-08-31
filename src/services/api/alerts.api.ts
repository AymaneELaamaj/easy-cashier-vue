import { api } from './axios';
import type { 
  SecurityDashboard, 
  SecurityStats, 
  SecurityAlert,
  LogEntry,
  SearchCriteria,
  UserSession,
  IncidentReport
} from '@/types/entities';

const SECURITY_BASE_URL = '/security';

export const securityApi = {
  // Dashboard principal
  getDashboard: async (): Promise<SecurityDashboard> => {
    const response = await api.get(`${SECURITY_BASE_URL}/dashboard`);
    return response.data;
  },

  // Alertes
  getAlerts: async (includeResolved = false): Promise<SecurityAlert[]> => {
    const response = await api.get(`${SECURITY_BASE_URL}/alerts`, {
      params: { includeResolved }
    });
    return response.data;
  },

  resolveAlert: async (alertId: number): Promise<string> => {
    const response = await api.post(`${SECURITY_BASE_URL}/alerts/${alertId}/resolve`);
    return response.data;
  },

  // Statistiques
  getStats: async (): Promise<SecurityStats> => {
    const response = await api.get(`${SECURITY_BASE_URL}/stats`);
    return response.data;
  },

  // Investigation des logs
  searchLogs: async (criteria: SearchCriteria): Promise<{
    results: LogEntry[];
    totalFound: number;
    searchCriteria: SearchCriteria;
    searchTime: string;
  }> => {
    const response = await api.post(`${SECURITY_BASE_URL}/investigation/search`, criteria);
    return response.data;
  },

  getUserTimeline: async (
    userId: number, 
    startDate?: string, 
    endDate?: string
  ): Promise<{
    userId: number;
    timeRange: { start: string; end: string };
    sessions: UserSession[];
    totalEvents: number;
  }> => {
    const response = await api.get(`${SECURITY_BASE_URL}/investigation/user-timeline/${userId}`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  detectAnomalies: async (
    startDate?: string, 
    endDate?: string
  ): Promise<{
    timeRange: { start: string; end: string };
    totalAnomalies: number;
    anomaliesByType: Record<string, LogEntry[]>;
    criticalCount: number;
  }> => {
    const response = await api.get(`${SECURITY_BASE_URL}/investigation/anomalies`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  generateIncidentReport: async (
    incidentType: string, 
    criteria: SearchCriteria
  ): Promise<IncidentReport> => {
    const response = await api.post(
      `${SECURITY_BASE_URL}/investigation/incident-report`,
      criteria,
      { params: { incidentType } }
    );
    return response.data;
  },

  quickSearch: async (keyword: string, limit = 100): Promise<LogEntry[]> => {
    const response = await api.get(`${SECURITY_BASE_URL}/investigation/quick-search`, {
      params: { keyword, limit }
    });
    return response.data;
  },

  getInvestigationStatistics: async (
    startDate?: string, 
    endDate?: string
  ): Promise<{
    totalLogs: number;
    timeRange: { start: string; end: string };
    logsByLevel: Record<string, number>;
    topUsers: Record<string, number>;
    eventTypes: Record<string, number>;
  }> => {
    const response = await api.get(`${SECURITY_BASE_URL}/investigation/statistics`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // SSRF Testing (pour dev/test)
  testUrl: async (url: string): Promise<{
    url: string;
    safe: boolean;
    message: string;
  }> => {
    const response = await api.get(`${SECURITY_BASE_URL}/ssrf/test-url`, {
      params: { url }
    });
    return response.data;
  },

  getApprovedDomains: async (): Promise<{
    approvedDomains: string[];
  }> => {
    const response = await api.get(`${SECURITY_BASE_URL}/ssrf/approved-domains`);
    return response.data;
  },

  runSecurityTest: async (): Promise<{
    dangerousUrlsTest: Record<string, boolean>;
    allBlocked: boolean;
  }> => {
    const response = await api.get(`${SECURITY_BASE_URL}/ssrf/security-test`);
    return response.data;
  },

  // Intégrité des logs
  getIntegrityReport: async (): Promise<{
    timestamp: string;
    fileIntegrity: Record<string, boolean>;
    checksumCount: number;
    integritySystemStatus: string;
  }> => {
    const response = await api.get(`${SECURITY_BASE_URL}/integrity/report`);
    return response.data;
  }
};