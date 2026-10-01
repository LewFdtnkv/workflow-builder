import { http, isRemoteApiConfigured } from '../../../shared/api/http'
import type { Run, Workflow } from '../model/types'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}
export interface ExecutionResult {
  id: string
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'
  startedAt?: string
  finishedAt?: string
  error?: string
}

export const workflowApi = {
  isRemote: isRemoteApiConfigured,
  list: () => http<Workflow[]>('/api/workflows'),
  create: (workflow: Workflow) =>
    http<Workflow>('/api/workflows', { method: 'POST', body: JSON.stringify(workflow) }),
  update: (id: string, workflow: Workflow) =>
    http<Workflow>(`/api/workflows/${id}`, { method: 'PUT', body: JSON.stringify(workflow) }),
  remove: (id: string) => http<void>(`/api/workflows/${id}`, { method: 'DELETE' }),
  validate: (id: string) => http<ValidationResult>(`/api/workflows/${id}/validate`, { method: 'POST' }),
  execute: (id: string) => http<ExecutionResult>(`/api/workflows/${id}/execute`, { method: 'POST' }),
  execution: (id: string) => http<ExecutionResult>(`/api/executions/${id}`),
  history: (id: string) => http<Run[]>(`/api/workflows/${id}/executions`),
}
