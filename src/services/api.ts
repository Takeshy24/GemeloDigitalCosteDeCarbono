const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type ResourceKind = 'projects' | 'sensors' | 'edge' | 'cloud' | 'twins' | 'emission-factors' | 'scenarios' | 'users' | 'audit-logs';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  if (!response.ok) throw new Error(`API ${response.status}: ${await response.text()}`);
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
}

export const carbonApi = {
  list: <T>(kind: ResourceKind) => request<T[]>(`/api/resources/${kind}`),
  save: <T extends { id: string; projectId?: string }>(kind: ResourceKind, data: T) => request<T>(`/api/resources/${kind}/${encodeURIComponent(data.id)}`, { method: 'PUT', body: JSON.stringify({ id: data.id, projectId: data.projectId, data }) }),
  remove: (kind: ResourceKind, id: string) => request<void>(`/api/resources/${kind}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  bootstrap: (resources: Partial<Record<ResourceKind, unknown[]>>) => request<{ created: number }>('/api/bootstrap', { method: 'POST', body: JSON.stringify({ resources }) }),
  analyze: (project: unknown, assessment: unknown, userPrompt: string) => request<{ analysis: string; source: string }>('/api/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({ project, assessment, userPrompt }),
  }),
};
