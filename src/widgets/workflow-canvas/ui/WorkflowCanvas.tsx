import { Activity, Check, ZoomIn, ZoomOut } from 'lucide-react'
import { useRef, useState } from 'react'
import { useWorkflowEditorContext } from '../../../features/workflow-editor/model/WorkflowEditorContext'
import type { WorkflowNode } from '../../../entities/workflow/model/types'

const nodeIcons = { start: '▶', http: '⇄', condition: '◇', result: '✓' }

export function WorkflowCanvas() {
  const editor = useWorkflowEditorContext()
  const [zoom, setZoom] = useState(1)
  const [viewport, setViewport] = useState({ x: 0, y: 0 })
  const [linkSource, setLinkSource] = useState<string | null>(null)
  const drag = useRef<{ node: WorkflowNode; clientX: number; clientY: number } | null>(null)
  const pan = useRef<{ x: number; y: number; clientX: number; clientY: number } | null>(null)
  const getNode = (id: string) => editor.current.nodes.find((node) => node.id === id)!
  const edgePath = (source: WorkflowNode, target: WorkflowNode) => {
    const x1 = source.x + 174,
      y1 = source.y + 49,
      x2 = target.x,
      y2 = target.y + 49
    const curve = Math.max(60, Math.abs(x2 - x1) * 0.45)
    return `M ${x1} ${y1} C ${x1 + curve} ${y1}, ${x2 - curve} ${y2}, ${x2} ${y2}`
  }
  const onMove = (event: React.PointerEvent) => {
    if (drag.current) {
      const { node, clientX, clientY } = drag.current
      editor.updateNode(node.id, {
        x: Math.max(16, node.x + (event.clientX - clientX) / zoom),
        y: Math.max(16, node.y + (event.clientY - clientY) / zoom),
      })
    }
    if (pan.current)
      setViewport({
        x: pan.current.x + event.clientX - pan.current.clientX,
        y: pan.current.y + event.clientY - pan.current.clientY,
      })
  }
  return (
    <section className="graph-wrap">
      <div className="graph-toolbar">
        <button onClick={() => setZoom((value) => Math.max(0.6, value - 0.1))}>
          <ZoomOut size={16} />
        </button>
        <span className="zoom">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((value) => Math.min(1.6, value + 0.1))}>
          <ZoomIn size={16} />
        </button>
      </div>
      <div
        className="graph"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget)
            pan.current = { ...viewport, clientX: event.clientX, clientY: event.clientY }
        }}
        onPointerMove={onMove}
        onPointerUp={() => {
          drag.current = null
          pan.current = null
        }}
        onPointerLeave={() => {
          drag.current = null
          pan.current = null
        }}
      >
        <div className="canvas-label">
          <Activity size={15} />
          {linkSource ? 'Choose the target node' : 'Main flow'}
        </div>
        <div
          className="graph-content"
          style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${zoom})` }}
        >
          <svg className="connections">
            {editor.current.edges.map((edge) => (
              <g key={edge.id}>
                <path
                  d={edgePath(getNode(edge.source), getNode(edge.target))}
                  className="connection"
                  onDoubleClick={() => editor.removeEdge(edge.id)}
                />
                <path d={edgePath(getNode(edge.source), getNode(edge.target))} className="connection-arrow" />
                {edge.handle && (
                  <text
                    x={(getNode(edge.source).x + getNode(edge.target).x) / 2 + 70}
                    y={(getNode(edge.source).y + getNode(edge.target).y) / 2 + 38}
                    className={`branch ${edge.handle}`}
                  >
                    {edge.handle}
                  </text>
                )}
              </g>
            ))}
          </svg>
          {editor.current.nodes.map((node) => (
            <button
              key={node.id}
              className={`flow-node ${node.kind} ${node.id === editor.selectedId ? 'selected' : ''} status-${node.status}`}
              style={{ left: node.x, top: node.y }}
              onClick={() => editor.setSelected(node.id)}
              onPointerDown={(event) => {
                if (!(event.target as HTMLElement).closest('.port'))
                  drag.current = { node, clientX: event.clientX, clientY: event.clientY }
              }}
            >
              <i
                className="port in"
                onPointerUp={(event) => {
                  event.stopPropagation()
                  if (linkSource) editor.addEdge(linkSource, node.id)
                  setLinkSource(null)
                }}
              />
              <div className="node-icon">{nodeIcons[node.kind]}</div>
              <div className="node-copy">
                <strong>{node.label}</strong>
                <small>{node.kind}</small>
              </div>
              <span className="node-status">{node.status === 'success' ? <Check size={14} /> : ''}</span>
              <i
                className="port out"
                onPointerDown={(event) => {
                  event.stopPropagation()
                  setLinkSource(node.id)
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
