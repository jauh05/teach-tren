import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface PlainMarkdownProps {
  content: string
}

// Markdown without math. KaTeX is not loaded for answers that contain no formulas.
export default function PlainMarkdown({ content }: PlainMarkdownProps) {
  return (
    <div className="markdown-body">
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  )
}
