import 'katex/dist/katex.min.css'
import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { normalizeMath } from './normalizeMath'

interface MathMarkdownProps {
  content: string
}

// Markdown with LaTeX. Formulas that fail to render show their raw text (see .katex-error in index.css).
// Formulas the AI wrote without dollar signs are wrapped first (normalizeMath).
export default function MathMarkdown({ content }: MathMarkdownProps) {
  return (
    <div className="markdown-body">
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: 'ignore' }]]}
      >
        {normalizeMath(content)}
      </Markdown>
    </div>
  )
}
