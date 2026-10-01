export type NodeKind = 'start' | 'http' | 'condition' | 'result'
export type NodeStatus = 'idle' | 'running' | 'success' | 'failed' | 'skipped'
export interface WorkflowNode {
  id: string
  kind: NodeKind
  label: string
  x: number
  y: number
  status: NodeStatus
  config: Record<string, string>
}
export interface WorkflowEdge {
  id: string
  source: string
  target: string
  handle?: 'true' | 'false'
}
export interface Run {
  id: string
  at: string
  status: 'SUCCESS' | 'FAILED'
  duration: string
  output?: string
  error?: string
}
export interface Workflow {
  id: string
  name: string
  updatedAt: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  runs: Run[]
}
export const labels: Record<NodeKind, string> = {
  start: 'Start',
  http: 'HTTP Request',
  condition: 'Condition',
  result: 'Result',
}
export const defaults: Record<NodeKind, Record<string, string>> = {
  start: {},
  http: { method: 'GET', url: 'https://api.example.com/users', timeout: '10' },
  condition: { left: '{{http.status}}', operator: 'equals', right: '200' },
  result: { value: '{{http.body}}' },
}
