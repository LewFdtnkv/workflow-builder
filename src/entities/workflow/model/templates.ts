import { initialWorkflow } from './mock'
import type { Workflow } from './types'

export type TemplateId = 'customer-check' | 'health-check'
export const templateLabels: Record<TemplateId, string> = {
  'customer-check': 'Customer check',
  'health-check': 'API health check',
}

export function createFromTemplate(template: TemplateId): Workflow {
  const id = `template-${template}-${Date.now()}`
  const workflow = structuredClone(initialWorkflow)
  workflow.id = id
  workflow.name = templateLabels[template]
  workflow.updatedAt = 'Just now'
  workflow.runs = []
  workflow.nodes = workflow.nodes.map((node) => ({ ...node, id: `${node.id}-${id}`, status: 'idle' }))
  const nodeId = (idPart: string) => `${idPart}-${id}`
  workflow.edges =
    template === 'health-check'
      ? [
          { id: `edge-${id}`, source: nodeId('start'), target: nodeId('http') },
          { id: `edge-result-${id}`, source: nodeId('http'), target: nodeId('result-ok') },
        ]
      : []
  if (template === 'health-check') {
    workflow.nodes = workflow.nodes.filter(
      (node) => node.kind !== 'condition' && node.id !== nodeId('result-no'),
    )
    workflow.nodes.find((node) => node.kind === 'http')!.label = 'Check API health'
  }
  return workflow
}
