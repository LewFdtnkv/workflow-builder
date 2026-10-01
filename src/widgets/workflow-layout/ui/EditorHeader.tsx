import { Check, Download, History, Play, Redo2, Save, Undo2, Upload, Workflow } from 'lucide-react'
import { useRef } from 'react'
import { useWorkflowEditorContext } from '../../../features/workflow-editor/model/WorkflowEditorContext'
export function EditorHeader() {
  const e = useWorkflowEditorContext(),
    input = useRef<HTMLInputElement>(null)
  return (
    <>
      <header className="topbar">
        <div className="crumbs">
          <span>Workflows</span>
          <input value={e.current.name} onChange={(x) => e.rename(x.target.value)} />
        </div>
        <div className="actions">
          <input
            ref={input}
            hidden
            type="file"
            accept="application/json"
            onChange={(x) => {
              const f = x.target.files?.[0]
              if (f) e.importWorkflow(f)
            }}
          />
          <button className="button quiet" disabled={!e.canUndo} onClick={e.undo}>
            <Undo2 size={16} />
          </button>
          <button className="button quiet" disabled={!e.canRedo} onClick={e.redo}>
            <Redo2 size={16} />
          </button>
          <button className="button quiet" onClick={() => input.current?.click()}>
            <Upload size={16} />
          </button>
          <button className="button quiet" onClick={e.exportWorkflow}>
            <Download size={16} />
          </button>
          <button className="button quiet" onClick={e.validate}>
            <Check size={16} />
            Validate
          </button>
          <button className="button quiet" onClick={e.save}>
            <Save size={16} />
            Save
          </button>
          <button className="button run" disabled={e.isRunning} onClick={e.run}>
            <Play size={16} />
            Run
          </button>
        </div>
      </header>
      <div className="content-head">
        <div>
          <h1>{e.current.name}</h1>
          <p>Last edited {e.current.updatedAt}</p>
        </div>
        <div className="tabs">
          <button className={e.tab === 'editor' ? 'selected' : ''} onClick={() => e.setTab('editor')}>
            <Workflow size={16} />
            Editor
          </button>
          <button className={e.tab === 'history' ? 'selected' : ''} onClick={() => e.setTab('history')}>
            <History size={16} />
            Execution history <span>{e.current.runs.length}</span>
          </button>
        </div>
      </div>
    </>
  )
}
