import { forceCenter, forceCollide, forceLink, forceSimulation } from 'd3-force'
import type { Simulation, SimulationLinkDatum, SimulationNodeDatum } from 'd3-force'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Point } from './canvasMath'
import { resolveLabelOverlaps } from './labelLayout'

export interface LayoutNodeInput {
  id: string
  name: string
  radius: number
  x: number
  y: number
}

export interface LayoutLinkInput {
  source: string
  target: string
}

interface SimNode extends SimulationNodeDatum {
  id: string
  name: string
  radius: number
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  source: string
  target: string
}

// Layout time after a drag ends. The simulation stops within this window (docs/role.md 4.1).
const SETTLE_MS = 1000

// d3-force layout for topics. Positions are kept in memory only and reset on every page load.
export function useTopicLayout(nodes: LayoutNodeInput[], links: LayoutLinkInput[], center: Point) {
  const simulationRef = useRef<Simulation<SimNode, undefined> | null>(null)
  const nodesByIdRef = useRef(new Map<string, SimNode>())
  const stopTimerRef = useRef<number | null>(null)
  const [positions, setPositions] = useState<Record<string, Point>>({})

  useEffect(() => {
    const simNodes: SimNode[] = nodes.map((node) => ({
      id: node.id,
      name: node.name,
      radius: node.radius,
      x: node.x,
      y: node.y,
    }))
    const simLinks: SimLink[] = links.map((link) => ({ source: link.source, target: link.target }))

    const simulation = forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((node) => node.id)
          .distance(110)
          .strength(0.5),
      )
      .force(
        'collide',
        forceCollide<SimNode>((node) => node.radius + 10).strength(0.9),
      )
      .force('center', forceCenter(center.x, center.y).strength(0.04))
      .alphaDecay(0.1)
      .stop()

    // Settle the layout from the seed positions, then publish once after the first frame.
    simulation.tick(300)

    // Push label areas apart once the layout has settled, so topic names do not overlap (docs/role.md CC-03).
    const labelNodes = simNodes.map((node) => ({
      x: node.x ?? 0,
      y: node.y ?? 0,
      radius: node.radius,
      name: node.name,
    }))
    resolveLabelOverlaps(labelNodes)
    simNodes.forEach((node, index) => {
      node.x = labelNodes[index].x
      node.y = labelNodes[index].y
    })

    let frame = 0
    const publish = () => {
      const next: Record<string, Point> = {}
      for (const node of simNodes) {
        next[node.id] = { x: node.x ?? 0, y: node.y ?? 0 }
      }
      setPositions(next)
    }
    const schedulePublish = () => {
      if (frame === 0) {
        frame = requestAnimationFrame(() => {
          frame = 0
          publish()
        })
      }
    }

    simulation.on('tick', schedulePublish)
    simulationRef.current = simulation
    nodesByIdRef.current = new Map(simNodes.map((node) => [node.id, node]))
    schedulePublish()

    return () => {
      simulation.stop()
      if (frame !== 0) {
        cancelAnimationFrame(frame)
      }
      if (stopTimerRef.current !== null) {
        clearTimeout(stopTimerRef.current)
      }
      simulationRef.current = null
    }
  }, [nodes, links, center.x, center.y])

  const scheduleStop = useCallback(() => {
    if (stopTimerRef.current !== null) {
      clearTimeout(stopTimerRef.current)
    }
    stopTimerRef.current = window.setTimeout(() => {
      simulationRef.current?.stop()
      stopTimerRef.current = null
    }, SETTLE_MS)
  }, [])

  const startDrag = useCallback(
    (id: string) => {
      const node = nodesByIdRef.current.get(id)
      const simulation = simulationRef.current
      if (!node || !simulation) {
        return
      }
      node.fx = node.x
      node.fy = node.y
      if (stopTimerRef.current !== null) {
        clearTimeout(stopTimerRef.current)
        stopTimerRef.current = null
      }
      simulation.alphaTarget(0.3).restart()
    },
    [],
  )

  const dragTo = useCallback((id: string, point: Point) => {
    const node = nodesByIdRef.current.get(id)
    if (node) {
      node.fx = point.x
      node.fy = point.y
    }
  }, [])

  const endDrag = useCallback(
    (id: string) => {
      const node = nodesByIdRef.current.get(id)
      if (node) {
        node.fx = null
        node.fy = null
      }
      simulationRef.current?.alphaTarget(0)
      scheduleStop()
    },
    [scheduleStop],
  )

  // Keyboard move: shifts a topic and lets its neighbours adjust briefly.
  const nudge = useCallback(
    (id: string, dx: number, dy: number) => {
      const node = nodesByIdRef.current.get(id)
      const simulation = simulationRef.current
      if (!node || !simulation) {
        return
      }
      node.x = (node.x ?? 0) + dx
      node.y = (node.y ?? 0) + dy
      simulation.alpha(0.3).restart()
      scheduleStop()
    },
    [scheduleStop],
  )

  return { positions, startDrag, dragTo, endDrag, nudge }
}
