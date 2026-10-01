import { Check } from 'lucide-react'
import { useEffect } from 'react'
import {
  WorkflowEditorProvider,
  useWorkflowEditorContext,
} from '../../../features/workflow-editor/model/WorkflowEditorContext'
import { ExecutionHistory } from '../../../widgets/execution-history/ui/ExecutionHistory'
import { NodePalette } from '../../../widgets/node-palette/ui/NodePalette'
import { NodeProperties } from '../../../widgets/node-properties/ui/NodeProperties'
import { WorkflowCanvas } from '../../../widgets/workflow-canvas/ui/WorkflowCanvas'
import { EditorHeader } from '../../../widgets/workflow-layout/ui/EditorHeader'
import { WorkflowSidebar } from '../../../widgets/workflow-layout/ui/WorkflowSidebar'

function WorkflowEditorScreen() {
  const editor = useWorkflowEditorContext()
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.matches('input, textarea, select') || !(event.ctrlKey || event.metaKey)) return
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) editor.redo()
        else editor.undo()
      }
      if (event.key.toLowerCase() === 'y') {
        event.preventDefault()
        editor.redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [editor])
  return (
    <main className="app-shell">
      <WorkflowSidebar />
      <section className="workspace">
        <EditorHeader />
        {editor.tab === 'editor' ? (
          <div className="editor-layout">
            <NodePalette />
            <WorkflowCanvas />
            <NodeProperties />
          </div>
        ) : (
          <ExecutionHistory />
        )}
      </section>
      {editor.notice && (
        <div className="toast">
          <Check size={17} />
          {editor.notice}
        </div>
      )}
    </main>
  )
}

export default function WorkflowEditorPage() {
  return (
    <WorkflowEditorProvider>
      <WorkflowEditorScreen />
    </WorkflowEditorProvider>
  )
}
