import { wrapLabel } from './wrapLabel'

// Approximate width of one character at 11px Inter, in px.
const CHAR_WIDTH = 6.4
// Space above a topic for the "baru" tag.
const TAG_SPACE = 16
// Space below a topic for two label lines and the score line.
const LABEL_SPACE = 40
// Extra gap kept between two label boxes.
const PADDING = 4

export interface LabelNode {
  x: number
  y: number
  radius: number
  name: string
}

interface Box {
  left: number
  right: number
  top: number
  bottom: number
}

// Half the width of the label area: the circle or the longest label line, whichever is wider.
export function labelHalfWidth(name: string, radius: number): number {
  const longest = Math.max(0, ...wrapLabel(name).map((line) => line.length))
  return Math.max(radius, (longest * CHAR_WIDTH) / 2)
}

function boxOf(node: LabelNode): Box {
  const half = labelHalfWidth(node.name, node.radius)
  return {
    left: node.x - half,
    right: node.x + half,
    top: node.y - node.radius - TAG_SPACE,
    bottom: node.y + node.radius + LABEL_SPACE,
  }
}

// True when the topic and label areas of two nodes overlap.
export function labelBoxesOverlap(a: LabelNode, b: LabelNode): boolean {
  const boxA = boxOf(a)
  const boxB = boxOf(b)
  const overlapX = Math.min(boxA.right, boxB.right) - Math.max(boxA.left, boxB.left) + PADDING
  const overlapY = Math.min(boxA.bottom, boxB.bottom) - Math.max(boxA.top, boxB.top) + PADDING
  return overlapX > 0 && overlapY > 0
}

// Moves nodes apart until no two label areas overlap. Positions are changed in place.
export function resolveLabelOverlaps(nodes: LabelNode[], iterations = 200): void {
  for (let iteration = 0; iteration < iterations; iteration++) {
    let moved = false
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        if (!labelBoxesOverlap(a, b)) {
          continue
        }
        moved = true
        const boxA = boxOf(a)
        const boxB = boxOf(b)
        const overlapX = Math.min(boxA.right, boxB.right) - Math.max(boxA.left, boxB.left) + PADDING
        const overlapY = Math.min(boxA.bottom, boxB.bottom) - Math.max(boxA.top, boxB.top) + PADDING
        // Separate along the axis with the smaller overlap, so the nodes move the least.
        if (overlapX < overlapY) {
          const shift = overlapX / 2
          const direction = a.x <= b.x ? -1 : 1
          a.x += direction * shift
          b.x -= direction * shift
        } else {
          const shift = overlapY / 2
          const direction = a.y <= b.y ? -1 : 1
          a.y += direction * shift
          b.y -= direction * shift
        }
      }
    }
    if (!moved) {
      return
    }
  }
}
