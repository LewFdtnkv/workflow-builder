import { useState } from 'react'
import { History } from 'lucide-react'
import { useWorkflowEditorContext } from '../../../features/workflow-editor/model/WorkflowEditorContext'
import type { Run } from '../../../entities/workflow/model/types'

export function ExecutionHistory() {
  const editor = useWorkflowEditorContext()
  const [selected, setSelected] = useState<Run | null>(editor.current.runs[0] ?? null)
  if (!editor.current.runs.length)
    return (
      <div className="history-panel">
        <div className="empty-history">
          <History size={28} />
          <h3>No executions yet</h3>
          <p>Run the workflow to see results here.</p>
        </div>
      </div>
    )
  return (
    <div className="history-panel">
      <div className="history-top">
        <div>
          <h2>Execution history</h2>
          <p>Select a run to inspect its output.</p>
        </div>
      </div>
      <div className="history-layout">
        <div className="run-table">
          {editor.current.runs.map((run) => (
            <button key={run.id} className="run-row" onClick={() => setSelected(run)}>
              <strong>{run.id}</strong>
              <span className={`status-pill ${run.status.toLowerCase()}`}>
                <i />
                {run.status}
              </span>
              <span>{run.at}</span>
              <span>{run.duration}</span>
            </button>
          ))}
        </div>
        <aside className="execution-detail">
          <h3>Run details</h3>
          {selected && (
            <>
              <span className={`status-pill ${selected.status.toLowerCase()}`}>
                <i />
                {selected.status}
              </span>
              <dl>
                <dt>Execution ID</dt>
                <dd>{selected.id}</dd>
                <dt>Started</dt>
                <dd>{selected.at}</dd>
                <dt>Duration</dt>
                <dd>{selected.duration}</dd>
              </dl>
              <h4>{selected.error ? 'Error' : 'Output'}</h4>
              <pre>{selected.error ?? selected.output ?? '{\n  "status": "completed"\n}'}</pre>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
