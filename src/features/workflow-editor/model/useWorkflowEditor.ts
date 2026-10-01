import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { initialWorkflow } from '../../../entities/workflow/model/mock'
import {
  defaults,
  labels,
  type NodeKind,
  type Workflow,
  type WorkflowNode,
} from '../../../entities/workflow/model/types'
import {
  readWorkflows,
  useWorkflowsQuery,
  workflowQueryKey,
} from '../../../entities/workflow/api/useWorkflowsQuery'
import { workflowApi } from '../../../entities/workflow/api/workflowApi'
import { createFromTemplate, type TemplateId } from '../../../entities/workflow/model/templates'
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks'
import { workflowEditorActions } from './workflowEditorSlice'
import { createClientId } from '../../../shared/lib/createClientId'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function useWorkflowEditor() {
  const workflowsQuery = useWorkflowsQuery()
  const client = useQueryClient()
  const dispatch = useAppDispatch()
  const [workflows, setWorkflows] = useState<Workflow[]>(readWorkflows)
  const [past, setPast] = useState<Workflow[][]>([])
  const [future, setFuture] = useState<Workflow[][]>([])
  const [invalidNodeIds, setInvalidNodeIds] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const activeId = useAppSelector((s) => s.workflowEditor.activeWorkflowId)
  const selectedId = useAppSelector((s) => s.workflowEditor.selectedNodeId)
  const tab = useAppSelector((s) => s.workflowEditor.activeTab)
  const current = workflows.find((w) => w.id === activeId) ?? workflows[0]
  const selected = current.nodes.find((n) => n.id === selectedId) ?? current.nodes[0]
  const saveMutation = useMutation({
    mutationFn: ({ id, workflow }: { id: string; workflow: Workflow }) => workflowApi.update(id, workflow),
  })
  const validateMutation = useMutation({ mutationFn: (id: string) => workflowApi.validate(id) })
  const executeMutation = useMutation({ mutationFn: (id: string) => workflowApi.execute(id) })
  useEffect(() => localStorage.setItem('workflow-builder-data', JSON.stringify(workflows)), [workflows])
  useEffect(() => {
    if (!workflowsQuery.data?.length) return
    const timer = setTimeout(() => setWorkflows(workflowsQuery.data), 0)
    return () => clearTimeout(timer)
  }, [workflowsQuery.data])
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(''), 2800)
      return () => clearTimeout(timer)
    }
  }, [notice])
  const select = (workflowId: string) => {
    const workflow = workflows.find((w) => w.id === workflowId) ?? current
    dispatch(workflowEditorActions.setActiveWorkflowId(workflowId))
    dispatch(workflowEditorActions.setSelectedNodeId(workflow.nodes[0]?.id ?? ''))
    dispatch(workflowEditorActions.setActiveTab('editor'))
  }
  const patch = (updater: (value: Workflow) => Workflow) =>
    setWorkflows((list) => {
      setPast((history) => [...history.slice(-39), list])
      setFuture([])
      return list.map((w) => (w.id === current.id ? updater(w) : w))
    })
  const updateNode = (id: string, next: Partial<WorkflowNode>) =>
    patch((w) => ({
      ...w,
      updatedAt: 'Just now',
      nodes: w.nodes.map((n) => (n.id === id ? { ...n, ...next } : n)),
    }))
  const validateLocal = () => {
    const ids = new Set(current.nodes.map((n) => n.id))
    const reached = new Set<string>()
    const visit = (id: string) => {
      if (reached.has(id)) return
      reached.add(id)
      current.edges.filter((e) => e.source === id).forEach((e) => visit(e.target))
    }
    current.nodes.filter((n) => n.kind === 'start').forEach((n) => visit(n.id))
    return (
      current.nodes.filter((n) => n.kind === 'start').length === 1 &&
      current.nodes.some((n) => n.kind === 'result' && reached.has(n.id)) &&
      !current.nodes.some((n) => n.kind === 'http' && !/^https?:\/\//.test(n.config.url ?? '')) &&
      !current.edges.some((e) => !ids.has(e.source) || !ids.has(e.target))
    )
  }
  const addNode = (kind: NodeKind) => {
    const id = `${kind}-${Date.now()}`
    const count = current.nodes.filter((n) => n.kind === kind).length + 1
    const node: WorkflowNode = {
      id,
      kind,
      label: kind === 'http' ? `HTTP request ${count}` : `${labels[kind]} ${count}`,
      x: 330,
      y: 100 + current.nodes.length * 40,
      status: 'idle',
      config: { ...defaults[kind] },
    }
    patch((w) => ({ ...w, nodes: [...w.nodes, node] }))
    dispatch(workflowEditorActions.setSelectedNodeId(id))
  }
  const createWorkflow = () => {
    const id = createClientId('workflow')
    const nodes = initialWorkflow.nodes.map((n) => ({ ...n, id: `${n.id}-${id}`, status: 'idle' as const }))
    const workflow: Workflow = {
      ...initialWorkflow,
      id,
      name: 'Untitled workflow',
      updatedAt: 'Just now',
      nodes,
      edges: [],
      runs: [],
    }
    void createAndSelect(workflow)
  }
  const createAndSelect = async (workflow: Workflow) => {
    setWorkflows((list) => [...list, workflow])
    dispatch(workflowEditorActions.setActiveWorkflowId(workflow.id))
    dispatch(workflowEditorActions.setSelectedNodeId(workflow.nodes[0]?.id ?? ''))
    if (!workflowApi.isRemote) return
    try {
      const saved = await workflowApi.create(workflow)
      setWorkflows((list) => list.map((item) => (item.id === workflow.id ? saved : item)))
      dispatch(workflowEditorActions.setActiveWorkflowId(saved.id))
      dispatch(workflowEditorActions.setSelectedNodeId(saved.nodes[0]?.id ?? ''))
      client.invalidateQueries({ queryKey: workflowQueryKey })
    } catch {
      setNotice('Could not create workflow on the server')
    }
  }
  const createTemplate = (template: TemplateId) => {
    const workflow = createFromTemplate(template)
    void createAndSelect(workflow)
    setNotice(`${workflow.name} template created`)
  }
  const removeWorkflow = () => {
    if (workflows.length === 1) return setNotice('At least one workflow must remain')
    const next = workflows.find((workflow) => workflow.id !== current.id)!
    setWorkflows((list) => list.filter((workflow) => workflow.id !== current.id))
    dispatch(workflowEditorActions.setActiveWorkflowId(next.id))
    dispatch(workflowEditorActions.setSelectedNodeId(next.nodes[0]?.id ?? ''))
    if (workflowApi.isRemote) {
      void workflowApi.remove(current.id).catch(() => setNotice('Could not delete workflow on the server'))
    }
    setNotice('Workflow deleted')
  }
  const addEdge = (source: string, target: string) => {
    if (source === target || current.edges.some((e) => e.source === source && e.target === target)) return
    const sourceNode = current.nodes.find((n) => n.id === source)
    const count = current.edges.filter((e) => e.source === source).length
    patch((w) => ({
      ...w,
      edges: [
        ...w.edges,
        {
          id: `edge-${Date.now()}`,
          source,
          target,
          handle: sourceNode?.kind === 'condition' ? (count ? 'false' : 'true') : undefined,
        },
      ],
    }))
  }
  const removeNode = () => {
    if (selected.kind === 'start') return setNotice('Start node is required')
    patch((w) => ({
      ...w,
      nodes: w.nodes.filter((n) => n.id !== selected.id),
      edges: w.edges.filter((e) => e.source !== selected.id && e.target !== selected.id),
    }))
    dispatch(workflowEditorActions.setSelectedNodeId(current.nodes.find((n) => n.kind === 'start')!.id))
  }
  const save = async () => {
    if (!workflowApi.isRemote) return setNotice('Workflow saved locally')
    try {
      const saved = await saveMutation.mutateAsync({ id: current.id, workflow: current })
      patch(() => saved)
      client.invalidateQueries({ queryKey: workflowQueryKey })
      setNotice('Workflow saved')
    } catch {
      try {
        const saved = await workflowApi.create(current)
        patch(() => saved)
        dispatch(workflowEditorActions.setActiveWorkflowId(saved.id))
        client.invalidateQueries({ queryKey: workflowQueryKey })
        setNotice('Workflow saved')
      } catch {
        setNotice('Could not save workflow')
      }
    }
  }
  const validate = async () => {
    const bad = current.nodes
      .filter((n) => n.kind === 'http' && !/^https?:\/\//.test(n.config.url ?? ''))
      .map((n) => n.id)
    setInvalidNodeIds(bad)
    if (!workflowApi.isRemote) return setNotice(validateLocal() ? 'Workflow is valid' : 'Validation failed')
    try {
      const result = await validateMutation.mutateAsync(current.id)
      setNotice(result.valid ? 'Workflow is valid' : result.errors.join('; '))
    } catch {
      setNotice('Validation request failed')
    }
  }
  const run = async () => {
    if (!validateLocal()) return setNotice('Validation failed')
    if (!workflowApi.isRemote) {
      setIsRunning(true)
      patch((w) => ({ ...w, nodes: w.nodes.map((n) => ({ ...n, status: 'running' })) }))
      await wait(900)
      patch((w) => ({
        ...w,
        nodes: w.nodes.map((n) => ({ ...n, status: 'success' })),
        runs: [{ id: `run-${Date.now()}`, at: 'Just now', status: 'SUCCESS', duration: '0.9 s' }, ...w.runs],
      }))
      setIsRunning(false)
      return
    }
    setIsRunning(true)
    try {
      let execution = await executeMutation.mutateAsync(current.id)
      while (execution.status === 'PENDING' || execution.status === 'RUNNING') {
        await wait(1000)
        execution = await workflowApi.execution(execution.id)
      }
      const failed = execution.status === 'FAILED'
      patch((w) => ({
        ...w,
        nodes: w.nodes.map((n) => ({ ...n, status: failed ? 'failed' : 'success' })),
        runs: [
          {
            id: execution.id,
            at: execution.startedAt ?? 'Just now',
            status: failed ? 'FAILED' : 'SUCCESS',
            duration: 'Completed',
          },
          ...w.runs,
        ],
      }))
      setNotice(failed ? (execution.error ?? 'Execution failed') : 'Execution completed')
    } catch {
      setNotice('Execution request failed')
    } finally {
      setIsRunning(false)
    }
  }
  const undo = () => {
    const previous = past.at(-1)
    if (!previous) return
    setFuture((items) => [workflows, ...items])
    setPast((items) => items.slice(0, -1))
    setWorkflows(previous)
  }
  const redo = () => {
    const next = future[0]
    if (!next) return
    setPast((items) => [...items, workflows])
    setFuture((items) => items.slice(1))
    setWorkflows(next)
  }
  const exportWorkflow = () => {
    const blob = new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' })
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href
    link.download = `${current.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'workflow'}.json`
    link.click()
    URL.revokeObjectURL(href)
  }
  const importWorkflow = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Workflow
      if (!parsed.name || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) throw new Error()
      const imported = {
        ...parsed,
        id: `import-${Date.now()}`,
        name: `${parsed.name} (imported)`,
        updatedAt: 'Just now',
        runs: [],
      }
      void createAndSelect(imported)
      setNotice('Workflow imported')
    } catch {
      setNotice('Invalid workflow JSON')
    }
  }
  return {
    workflows,
    current,
    selected,
    selectedId,
    tab,
    notice,
    isRunning,
    invalidNodeIds,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,
    exportWorkflow,
    importWorkflow,
    select,
    setTab: (value: 'editor' | 'history') => dispatch(workflowEditorActions.setActiveTab(value)),
    setSelected: (id: string) => dispatch(workflowEditorActions.setSelectedNodeId(id)),
    updateNode,
    rename: (name: string) => patch((w) => ({ ...w, name, updatedAt: 'Unsaved changes' })),
    createWorkflow,
    removeWorkflow,
    createTemplate,
    addNode,
    addEdge,
    removeEdge: (id: string) => patch((w) => ({ ...w, edges: w.edges.filter((e) => e.id !== id) })),
    removeNode,
    save,
    validate,
    run,
  }
}
