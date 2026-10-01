import { useWorkflowEditorContext } from '../../../features/workflow-editor/model/WorkflowEditorContext'
import type { NodeKind } from '../../../entities/workflow/model/types'
const kinds: NodeKind[] = ['start', 'http', 'condition', 'result']
export function NodePalette() {
  const e = useWorkflowEditorContext()
  return (
    <aside className="palette">
      <div className="panel-title">TEMPLATES</div>
      <button className="template-button" onClick={() => e.createTemplate('health-check')}>
        API health check
      </button>
      <button className="template-button" onClick={() => e.createTemplate('customer-check')}>
        Customer check
      </button>
      <div className="panel-title node-title">NODES</div>
      {kinds.map((k) => (
        <button className={`palette-node ${k}`} key={k} onClick={() => e.addNode(k)}>
          <span>+</span>
          <div>
            <strong>{k}</strong>
            <small>Add node</small>
          </div>
        </button>
      ))}
    </aside>
  )
}
