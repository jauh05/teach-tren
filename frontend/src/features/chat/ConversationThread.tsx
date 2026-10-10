import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createMockAnswer } from '../../api/mockAnswer'
import { isGuestLimitReached } from '../../domain/guestQuota'
import type { ChatMessage } from '../../domain/types'
import { useSessionStore } from '../../stores/sessionStore'
import { Composer } from './Composer'
import { MessageBubble } from './MessageBubble'
import { NextStepsCard } from './NextStepsCard'
import { splitIntoChunks, streamChunks } from './streaming'

interface ConversationThreadProps {
  conversationId: string
  initialMessages: ChatMessage[]
  // Set when the page opens with a first question (from the home page or a learning node).
  initialQuestion?: string
}

interface InitialState {
  messages: ChatMessage[]
  streamingId: string | null
}

// Built once per mount so that the first question is sent exactly once.
function buildInitialState(initialMessages: ChatMessage[], initialQuestion?: string): InitialState {
  if (!initialQuestion) {
    return { messages: initialMessages, streamingId: null }
  }
  const streamingId = crypto.randomUUID()
  return {
    streamingId,
    messages: [
      ...initialMessages,
      { id: crypto.randomUUID(), role: 'user', content: initialQuestion, status: 'done' },
      { id: streamingId, role: 'assistant', content: '', status: 'streaming' },
    ],
  }
}

// One conversation: messages, streaming answers, and the composer.
export function ConversationThread({ conversationId, initialMessages, initialQuestion }: ConversationThreadProps) {
  const [initial] = useState(() => buildInitialState(initialMessages, initialQuestion))
  const [messages, setMessages] = useState<ChatMessage[]>(initial.messages)
  const [streaming, setStreaming] = useState(initial.streamingId !== null)
  const [draft, setDraft] = useState('')
  const isGuest = useSessionStore((state) => state.mode === 'guest')
  const guestActionsUsed = useSessionStore((state) => state.guestActionsUsed)
  // Guests who used both free actions cannot send. Their composer stays locked.
  const limitReached = isGuest && isGuestLimitReached(guestActionsUsed)
  // The active stream. Older streams are ignored once replaced, which keeps React StrictMode safe.
  const runRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (initial.streamingId !== null && initialQuestion) {
      runStream(initial.streamingId, initialQuestion)
    }
    return () => {
      runRef.current?.abort()
      runRef.current = null
    }
  }, [initial.streamingId, initialQuestion])

  useEffect(() => {
    const node = scrollRef.current
    if (node) {
      node.scrollTop = node.scrollHeight
    }
  }, [messages])

  function runStream(assistantId: string, question: string) {
    runRef.current?.abort()
    const controller = new AbortController()
    runRef.current = controller

    let text = ''
    void streamChunks(splitIntoChunks(createMockAnswer(question)), {
      signal: controller.signal,
      onChunk: (chunk) => {
        text += chunk
        const content = text
        setMessages((prev) => prev.map((message) => (message.id === assistantId ? { ...message, content } : message)))
      },
    }).then((completed) => {
      if (runRef.current !== controller) {
        return
      }
      runRef.current = null
      // Every finished or stopped answer uses one guest action. Replaced runs do not count.
      // Read the store at completion time, so the stream does not depend on render-time values.
      const session = useSessionStore.getState()
      if (session.mode === 'guest') {
        session.recordGuestAction()
      }
      setStreaming(false)
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId ? { ...message, status: completed ? 'done' : 'stopped' } : message,
        ),
      )
    })
  }

  function send(text: string) {
    const question = text.trim()
    if (question === '' || streaming || limitReached) {
      return
    }
    const assistantId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: question, status: 'done' },
      { id: assistantId, role: 'assistant', content: '', status: 'streaming' },
    ])
    setStreaming(true)
    setDraft('')
    runStream(assistantId, question)
  }

  function regenerate(assistantId: string) {
    const index = messages.findIndex((message) => message.id === assistantId)
    const question = messages
      .slice(0, index)
      .reverse()
      .find((message) => message.role === 'user')?.content
    if (!question || streaming || limitReached) {
      return
    }
    setStreaming(true)
    setMessages((prev) =>
      prev.map((message) => (message.id === assistantId ? { ...message, content: '', status: 'streaming' } : message)),
    )
    runStream(assistantId, question)
  }

  async function copy(content: string) {
    try {
      await navigator.clipboard.writeText(content)
    } catch {
      // The clipboard can be blocked by the browser. The action then does nothing.
    }
  }

  const lastMessage = messages[messages.length - 1]
  const showNextSteps = !streaming && lastMessage?.role === 'assistant' && lastMessage.status === 'done'

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[820px] flex-col gap-3.5 px-4 py-6 md:px-7">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onCopy={() => void copy(message.content)}
              onRegenerate={() => regenerate(message.id)}
              onCreateQuiz={() => navigate(`/kuis/${conversationId}`)}
            />
          ))}
          {showNextSteps && <NextStepsCard conversationId={conversationId} />}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[820px] px-4 pb-4 md:px-7">
        <Composer
          locked={limitReached}
          value={draft}
          onChange={setDraft}
          onSubmit={() => send(draft)}
          streaming={streaming}
          onStop={() => runRef.current?.abort()}
        />
      </div>
    </section>
  )
}
