import { LogOut, Plus, Trash2, Workflow } from 'lucide-react'
import { authApi } from '../../../features/auth/api/authApi'
import { useWorkflowEditorContext } from '../../../features/workflow-editor/model/WorkflowEditorContext'
export function WorkflowSidebar() {
  const e = useWorkflowEditorContext()
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">
          <Workflow size={19} />
        </span>
        <span>Flowcraft</span>
      </div>
      <button className="new-flow" onClick={e.createWorkflow}>
        <Plus size={16} />
        New workflow
      </button>
      <div className="sidebar-label">YOUR WORKFLOWS</div>
      <div className="workflow-list">
        {e.workflows.map((w) => (
          <button
            key={w.id}
            className={`workflow-entry ${w.id === e.current.id ? 'current' : ''}`}
            onClick={() => e.select(w.id)}
          >
            <span className="entry-dot">{w.name[0]}</span>
            <span>{w.name}</span>
            {w.id === e.current.id && (
              <Trash2
                size={14}
                onClick={(event) => {
                  event.stopPropagation()
                  e.removeWorkflow()
                }}
              />
            )}
          </button>
        ))}
      </div>
      <button
        className="sidebar-logout"
        onClick={() => {
          void authApi.logout().finally(() => {
            localStorage.removeItem('accessToken')
            window.location.reload()
          })
        }}
      >
        <LogOut size={15} />
        Выйти
      </button>
    </aside>
  )
}
