import { createContext, type PropsWithChildren, useContext } from 'react'
import { useWorkflowEditor } from './useWorkflowEditor'

type WorkflowEditorContextValue = ReturnType<typeof useWorkflowEditor>
const WorkflowEditorContext = createContext<WorkflowEditorContextValue | null>(null)

export function WorkflowEditorProvider({ children }: PropsWithChildren) {
  const value = useWorkflowEditor()
  return <WorkflowEditorContext.Provider value={value}>{children}</WorkflowEditorContext.Provider>
}

export function useWorkflowEditorContext() {
  const value = useContext(WorkflowEditorContext)
  if (!value) throw new Error('useWorkflowEditorContext must be used inside WorkflowEditorProvider')
  return value
}
