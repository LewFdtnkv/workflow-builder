import { WorkflowEditorPage } from '../pages/workflow-editor'
import { AuthGate } from '../features/auth/ui/AuthGate'
import '../shared/styles/main.scss'

export function App() {
  return (
    <AuthGate>
      <WorkflowEditorPage />
    </AuthGate>
  )
}
