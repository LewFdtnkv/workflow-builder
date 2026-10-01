import { useQuery } from '@tanstack/react-query'
import { initialWorkflow } from '../model/mock'
import { workflowApi } from './workflowApi'
import type { Workflow } from '../model/types'

const storageKey = 'workflow-builder-data'
export const workflowQueryKey = ['workflows'] as const

export function readWorkflows(): Workflow[] {
  const cached = localStorage.getItem(storageKey)
  return cached
    ? (JSON.parse(cached) as Workflow[])
    : [
        initialWorkflow,
        { ...initialWorkflow, id: 'daily-report', name: 'Daily report', updatedAt: 'Yesterday', runs: [] },
      ]
}

export function useWorkflowsQuery() {
  return useQuery({
    queryKey: workflowQueryKey,
    queryFn: async () => {
      if (!workflowApi.isRemote) return readWorkflows()
      try {
        return await workflowApi.list()
      } catch {
        return readWorkflows()
      }
    },
    staleTime: Infinity,
  })
}
