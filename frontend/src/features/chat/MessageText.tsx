import { lazy, Suspense } from 'react'
import { containsMath } from './containsMath'

// KaTeX and its plugins load only when an answer contains formulas (docs/role.md section 5).
const MathMarkdown = lazy(() => import('./MathMarkdown'))
const PlainMarkdown = lazy(() => import('./PlainMarkdown'))

interface MessageTextProps {
  content: string
}

// Renders a finished answer as Markdown. While the answer streams, the parent shows plain text instead.
export function MessageText({ content }: MessageTextProps) {
  const Renderer = containsMath(content) ? MathMarkdown : PlainMarkdown
  return (
    <Suspense fallback={<div className="whitespace-pre-wrap">{content}</div>}>
      <Renderer content={content} />
    </Suspense>
  )
}
