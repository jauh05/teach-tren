import { lazy, Suspense } from 'react'
import { containsMath } from './containsMath'

// KaTeX and its plugins load only when an answer contains formulas (docs/role.md section 5).
const MathMarkdown = lazy(() => import('./MathMarkdown'))
const PlainMarkdown = lazy(() => import('./PlainMarkdown'))

interface RichTextProps {
  content: string
}

// Markdown with optional LaTeX. KaTeX loads only when the text contains a formula.
export function RichText({ content }: RichTextProps) {
  const Renderer = containsMath(content) ? MathMarkdown : PlainMarkdown
  return (
    <Suspense fallback={<div className="whitespace-pre-wrap">{content}</div>}>
      <Renderer content={content} />
    </Suspense>
  )
}
