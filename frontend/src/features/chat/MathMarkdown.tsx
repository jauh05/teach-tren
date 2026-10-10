import 'katex/dist/katex.min.css'
import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

interface MathMarkdownProps {
  content: string
}

// Markdown with LaTeX. Formulas that fail to render show their raw text (see .katex-error in index.css).
export default function MathMarkdown({ content }: MathMarkdownProps) {
  return (
    <div className="markdown-body">
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: 'ignore' }]]}
      >
        {content}
      </Markdown>
    </div>
  )
}
