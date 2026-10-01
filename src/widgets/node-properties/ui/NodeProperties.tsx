import { Trash2 } from 'lucide-react'
import { useWorkflowEditorContext } from '../../../features/workflow-editor/model/WorkflowEditorContext'
export function NodeProperties() {
  const e = useWorkflowEditorContext(),
    n = e.selected
  const set = (key: string, value: string) => e.updateNode(n.id, { config: { ...n.config, [key]: value } })
  return (
    <aside className="properties">
      <div className="properties-head">
        <strong>{n.kind} settings</strong>
      </div>
      <div className="form-scroll">
        <label>
          NAME
          <input value={n.label} onChange={(x) => e.updateNode(n.id, { label: x.target.value })} />
        </label>
        {Object.entries(n.config).map(([k, v]) => (
          <label key={k}>
            {k.toUpperCase()}
            <textarea value={v} onChange={(x) => set(k, x.target.value)} />
          </label>
        ))}
      </div>
      <div className="properties-foot">
        <button className="delete" onClick={e.removeNode}>
          <Trash2 size={16} />
          Delete node
        </button>
      </div>
    </aside>
  )
}
