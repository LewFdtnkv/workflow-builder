import type { Workflow } from './types'

export const initialWorkflow: Workflow = {
  id: 'customer-check',
  name: 'Customer check',
  updatedAt: 'Just now',
  runs: [
    { id: 'run-1', at: 'Today, 14:32', status: 'SUCCESS', duration: '1.4 s' },
    { id: 'run-2', at: 'Today, 12:18', status: 'FAILED', duration: '0.8 s' },
  ],
  nodes: [
    { id: 'start', kind: 'start', label: 'Start', x: 72, y: 215, status: 'success', config: {} },
    {
      id: 'http',
      kind: 'http',
      label: 'Get customer',
      x: 285,
      y: 215,
      status: 'success',
      config: { method: 'GET', url: 'https://api.example.com/customers/42', timeout: '10' },
    },
    {
      id: 'condition',
      kind: 'condition',
      label: 'Customer exists?',
      x: 555,
      y: 215,
      status: 'success',
      config: { left: '{{http.status}}', operator: 'equals', right: '200' },
    },
    {
      id: 'result-ok',
      kind: 'result',
      label: 'Customer found',
      x: 850,
      y: 115,
      status: 'success',
      config: { value: '{{http.body}}' },
    },
    {
      id: 'result-no',
      kind: 'result',
      label: 'Customer missing',
      x: 850,
      y: 360,
      status: 'skipped',
      config: { value: '{ "message": "Customer not found" }' },
    },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'http' },
    { id: 'e2', source: 'http', target: 'condition' },
    { id: 'e3', source: 'condition', target: 'result-ok', handle: 'true' },
    { id: 'e4', source: 'condition', target: 'result-no', handle: 'false' },
  ],
}
