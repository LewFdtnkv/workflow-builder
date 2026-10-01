import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface EditorState {
  activeWorkflowId: string
  selectedNodeId: string
  activeTab: 'editor' | 'history'
}
const initialState: EditorState = {
  activeWorkflowId: 'customer-check',
  selectedNodeId: 'http',
  activeTab: 'editor',
}

const workflowEditorSlice = createSlice({
  name: 'workflowEditor',
  initialState,
  reducers: {
    setActiveWorkflowId: (state, action: PayloadAction<string>) => {
      state.activeWorkflowId = action.payload
    },
    setSelectedNodeId: (state, action: PayloadAction<string>) => {
      state.selectedNodeId = action.payload
    },
    setActiveTab: (state, action: PayloadAction<EditorState['activeTab']>) => {
      state.activeTab = action.payload
    },
  },
})

export const workflowEditorActions = workflowEditorSlice.actions
export default workflowEditorSlice.reducer
