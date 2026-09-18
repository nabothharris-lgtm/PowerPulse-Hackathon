import {
  User,
  Report,
  Incident,
  Assignment,
  Category,
  LocationArea,
  Notification,
  WorkUpdate,
  ResolutionEvidence,
  StatusHistory,
  IncidentPriority,
  IncidentSeverity,
  ResolutionOutcome
} from '../types';

let authToken: string | null = null;

try {
  const saved = localStorage.getItem('powerpulse_token');
  if (saved && saved !== 'undefined' && saved !== 'null') {
    authToken = saved;
  }
} catch {
  // localStorage might be unavailable
}

export function setApiToken(token: string | null) {
  if (token && token !== 'undefined' && token !== 'null') {
    authToken = token;
    try {
      localStorage.setItem('powerpulse_token', token);
    } catch {
      // ignore
    }
  } else {
    authToken = null;
    try {
      localStorage.removeItem('powerpulse_token');
    } catch {
      // ignore
    }
  }
}

export function getApiToken(): string | null {
  return authToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  auth: {
    login: (identifier: string, password?: string) =>
      request<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, email: identifier, phone: identifier, password }),
      }),
    register: (data: { name: string; phone: string; email?: string; district?: string; subArea?: string; password?: string }) =>
      request<{ user: User; token: string; message: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    applyEngineer: (data: {
      name: string;
      phone: string;
      email?: string;
      professionalId: string;
      organizationId?: string;
      serviceArea?: string;
      applicationNotes?: string;
    }) =>
      request<{ user: User; token: string; message: string }>('/api/auth/apply-engineer', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    logout: () =>
      request<{ success: boolean }>('/api/auth/logout', {
        method: 'POST',
      }),
    me: () => request<{ user: User }>('/api/auth/me'),
    getDemoUsers: () => request<{ users: User[] }>('/api/auth/demo-users'),
  },
  reports: {
    list: (params?: { status?: string; categoryId?: string; district?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.categoryId) query.set('categoryId', params.categoryId);
      if (params?.district) query.set('district', params.district);
      if (params?.search) query.set('search', params.search);
      const qs = query.toString();
      return request<{ reports: Report[] }>(`/api/reports${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) =>
      request<{ report: Report; linkedIncident: Incident | null; history: StatusHistory[] }>(
        `/api/reports/${id}`
      ),
    create: (data: Partial<Report>) =>
      request<{ report: Report; duplicateSuppressed?: boolean }>('/api/reports', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    verify: (id: string, reason?: string) =>
      request<{ report: Report }>(`/api/reports/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    reject: (id: string, reason: string) =>
      request<{ report: Report }>(`/api/reports/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    requestInfo: (id: string, reason: string) =>
      request<{ report: Report }>(`/api/reports/${id}/request-information`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    provideInfo: (id: string, details: string) =>
      request<{ report: Report }>(`/api/reports/${id}/provide-information`, {
        method: 'POST',
        body: JSON.stringify({ details }),
      }),
    getDuplicateCandidates: (id: string) =>
      request<{
        candidateReports: { report: Report; distanceMeters: number; matchScore: number }[];
        candidateIncidents: { incident: Incident; distanceMeters: number; relevance: number }[];
      }>(`/api/reports/${id}/duplicate-candidates`),
  },
  incidents: {
    list: (params?: { status?: string; priority?: string; categoryId?: string; district?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.priority) query.set('priority', params.priority);
      if (params?.categoryId) query.set('categoryId', params.categoryId);
      if (params?.district) query.set('district', params.district);
      if (params?.search) query.set('search', params.search);
      const qs = query.toString();
      return request<{ incidents: Incident[] }>(`/api/incidents${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) =>
      request<{
        incident: Incident;
        relatedReports: Report[];
        assignments: Assignment[];
        workUpdates: WorkUpdate[];
        resolutionEvidence: ResolutionEvidence[];
        history: StatusHistory[];
      }>(`/api/incidents/${id}`),
    create: (data: {
      title: string;
      primaryReportId?: string;
      categoryId: string;
      description?: string;
      severity?: IncidentSeverity;
      priority?: IncidentPriority;
      locationName: string;
      district?: string;
      subArea?: string;
      latitude: number;
      longitude: number;
      affectedRadiusMeters?: number;
      affectedCustomersEst?: number;
      organizationId?: string;
    }) =>
      request<{ incident: Incident }>('/api/incidents', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    linkReport: (incidentId: string, reportId: string) =>
      request<{ incident: Incident; report: Report }>(`/api/incidents/${incidentId}/link-report`, {
        method: 'POST',
        body: JSON.stringify({ reportId }),
      }),
    unlinkReport: (incidentId: string, reportId: string) =>
      request<{ incident: Incident }>(`/api/incidents/${incidentId}/unlink-report`, {
        method: 'POST',
        body: JSON.stringify({ reportId }),
      }),
    updatePriority: (id: string, data: { priority?: IncidentPriority; severity?: IncidentSeverity; reason?: string }) =>
      request<{ incident: Incident }>(`/api/incidents/${id}/priority`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    assign: (id: string, data: { engineerId: string; teamId?: string; organizationId?: string; notes?: string }) =>
      request<{ incident: Incident; assignment: Assignment }>(`/api/incidents/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    confirmRestoration: (id: string, data: { rating: number; comment?: string }) =>
      request<{ incident: Incident }>(`/api/incidents/${id}/confirm`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    disputeRestoration: (id: string, data: { reason: string }) =>
      request<{ incident: Incident }>(`/api/incidents/${id}/dispute`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    close: (id: string, reason?: string) =>
      request<{ incident: Incident }>(`/api/incidents/${id}/close`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },
  assignments: {
    getMyJobs: () =>
      request<{ jobs: { assignment: Assignment; incident: Incident }[] }>('/api/assignments/my'),
    accept: (assignmentId: string) =>
      request<{ assignment: Assignment; incident: Incident }>(`/api/assignments/${assignmentId}/accept`, {
        method: 'POST',
      }),
    decline: (assignmentId: string, reason: string) =>
      request<{ assignment: Assignment; incident: Incident }>(`/api/assignments/${assignmentId}/decline`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    markEnRoute: (assignmentId: string, note?: string) =>
      request<{ incident: Incident; update: WorkUpdate }>(`/api/assignments/${assignmentId}/en-route`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      }),
    startWork: (assignmentId: string, note?: string) =>
      request<{ incident: Incident; update: WorkUpdate }>(`/api/assignments/${assignmentId}/start-work`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      }),
    addWorkUpdate: (assignmentId: string, data: { note?: string; isBlocked?: boolean; blockedReason?: string; evidenceUrl?: string }) =>
      request<{ update: WorkUpdate }>(`/api/assignments/${assignmentId}/work-update`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    resolve: (assignmentId: string, data: { outcome: ResolutionOutcome; note: string; photoUrl?: string; additionalNotes?: string }) =>
      request<{ incident: Incident; assignment: Assignment; evidence: ResolutionEvidence }>(
        `/api/assignments/${assignmentId}/resolve`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),
  },
  notifications: {
    list: () => request<{ notifications: Notification[]; unreadCount: number }>('/api/notifications'),
    markRead: (id: string) =>
      request<{ success: boolean }>(`/api/notifications/${id}/read`, {
        method: 'POST',
      }),
    markAllRead: () =>
      request<{ success: boolean }>('/api/notifications/read-all', {
        method: 'POST',
      }),
  },
  dashboard: {
    getOperationsMetrics: () =>
      request<{
        metrics: {
          totalReports: number;
          unverifiedReports: number;
          needsInfoReports: number;
          linkedReports: number;
          totalIncidents: number;
          openIncidents: number;
          emergencyIncidents: number;
          inProgressIncidents: number;
          resolutionPendingIncidents: number;
          reopenedIncidents: number;
          closedIncidents: number;
        };
        workloadByEngineer: {
          engineerId: string;
          name: string;
          phone: string;
          activeJobs: number;
          completedJobs: number;
          status: string;
        }[];
        categoryCounts: {
          categoryId: string;
          name: string;
          count: number;
          hazardLevel: string;
        }[];
        recentHistory: StatusHistory[];
      }>('/api/dashboard/operations'),
    getMapPins: () =>
      request<{
        incidents: any[];
        unlinkedReports: any[];
      }>('/api/dashboard/map'),
  },
  admin: {
    getOverview: () => request<any>('/api/admin/overview'),
    getUsers: () => request<{ users: User[] }>('/api/admin/users'),
    getApplications: () => request<{ applications: User[] }>('/api/admin/applications'),
    reviewApplication: (id: string, decision: 'APPROVE' | 'REJECT', options?: { teamId?: string; rejectionReason?: string }) =>
      request<{ success: boolean; user: User; message: string }>(`/api/admin/applications/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ decision, ...options }),
      }),
    createUser: (data: any) =>
      request<{ user: User }>('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateUser: (id: string, data: any) =>
      request<any>(`/api/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    createCategory: (data: any) =>
      request<any>(`/api/admin/categories`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    resetDemo: () =>
      request<{ success: boolean; message: string }>('/api/admin/reset-demo', {
        method: 'POST',
      }),
  },
  export: {
    getDataset: (dataset: string, format: 'json' | 'csv' = 'json', district?: string) => {
      const qs = new URLSearchParams({ dataset, format });
      if (district) qs.set('district', district);
      if (format === 'csv') {
        return fetch(`/api/export/dataset?${qs.toString()}`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
        }).then(res => {
          if (!res.ok) throw new Error(`Export failed: ${res.statusText}`);
          return res.text();
        });
      }
      return request<{ dataset: string; districtScope: string; generatedAt: string; totalRecords: number; records: any[] }>(
        `/api/export/dataset?${qs.toString()}`
      );
    }
  },
  references: {
    getCategories: () => request<{ categories: Category[] }>('/api/categories'),
    getLocations: () => request<{ locations: LocationArea[] }>('/api/locations'),
  },
};
