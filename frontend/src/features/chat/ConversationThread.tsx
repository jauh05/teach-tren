import { useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveConversationMessages } from '../../api/conversations'
import { ApiError } from '../../api/http'
import { historyOf, streamAnswer } from '../../api/chat'
import { createTopic } from '../../api/topics'
import { isGuestLimitReached } from '../../domain/guestQuota'
import { topicNameFromQuestion } from '../../domain/topicNames'
import type { ChatMessage } from '../../domain/types'
import { useSessionStore } from '../../stores/sessionStore'
import { useUiStore } from '../../stores/uiStore'
import { ChatQuizPanel } from '../kuis/ChatQuizPanel'
import { Composer } from './Composer'
import { MessageBubble } from './MessageBubble'
import { NextStepsCard } from './NextStepsCard'

// The home page sends new chats to this id. Those chats are not saved under it.
const UNSAVED_CONVERSATION_ID = 'baru'

interface ConversationThreadProps {
  conversationId: string
  initialMessages: ChatMessage[]
  // Set when the page opens with a first question (from the home page).
  initialQuestion?: string
  // Title used when the conversation is first saved. Defaults to the first question.
  title?: string
  // Shown while the conversation has no messages.
  emptyText?: string
  // Narrow layout for the side panel on Learning.
  compact?: boolean
}

interface InitialState {
  messages: ChatMessage[]
  // Messages before the first question. They are the context of the first answer.
  history: ChatMessage[]
  streamingId: string | null
}

// Built once per mount so that the first question is sent exactly once.
function buildInitialState(initialMessages: ChatMessage[], initialQuestion?: string): InitialState {
  if (!initialQuestion) {
    return { messages: initialMessages, history: initialMessages, streamingId: null }
  }
  const streamingId = crypto.randomUUID()
  return {
    streamingId,
    history: initialMessages,
    messages: [
      ...initialMessages,
      { id: crypto.randomUUID(), role: 'user', content: initialQuestion, status: 'done' },
      { id: streamingId, role: 'assistant', content: '', status: 'streaming' },
    ],
  }
}

// One conversation: messages, streaming answers, and the composer.
export function ConversationThread({
  conversationId,
  initialMessages,
  initialQuestion,
  title,
  emptyText,
  compact = false,
}: ConversationThreadProps) {
  const [initial] = useState(() => buildInitialState(initialMessages, initialQuestion))
  const [messages, setMessages] = useState<ChatMessage[]>(initial.messages)
  const [streaming, setStreaming] = useState(initial.streamingId !== null)
  const [draft, setDraft] = useState('')
  const queryClient = useQueryClient()
  const isGuest = useSessionStore((state) => state.mode === 'guest')
  const guestActionsUsed = useSessionStore((state) => state.guestActionsUsed)
  // Guests who used both free actions cannot send. Their composer stays locked.
  const limitReached = isGuest && isGuestLimitReached(guestActionsUsed)
  // The active stream. Older streams are ignored once replaced, which keeps React StrictMode safe.
  const runRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  // A new chat is saved under its own id, so it shows in the history as soon as the first answer exists.
  const [draftId] = useState(() => crypto.randomUUID())
  const storageId = conversationId === UNSAVED_CONVERSATION_ID ? draftId : conversationId
  const chatQuiz = useUiStore((state) => state.chatQuiz)
  const openQuizSetup = useUiStore((state) => state.openQuizSetup)
  const endChatQuiz = useUiStore((state) => state.endChatQuiz)
  const [topicNotice, setTopicNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const node = scrollRef.current
    if (node) {
      node.scrollTop = node.scrollHeight
    }
  }, [messages])

  // Keep the conversation in the history, so it survives navigation and shows in the chat list.
  // Saved once each answer has finished, not on every streamed chunk. A failed save is retried on the next change.
  // The chat list is refreshed and a new chat changes its address only after the save is stored.
  useEffect(() => {
    if (streaming) {
      return
    }
    saveConversationMessages(storageId, messages, title)
      .then(async () => {
        await queryClient.invalidateQueries({ queryKey: ['conversations'] })
        if (conversationId === UNSAVED_CONVERSATION_ID && messages.length > 0) {
          navigate(`/c/${draftId}`, { replace: true })
        }
      })
      .catch(() => undefined)
  }, [storageId, messages, title, streaming, conversationId, draftId, navigate, queryClient])

  // Streams one answer from the server. "history" is the chat before the question, used as context.
  const runStream = useCallback(
    (assistantId: string, question: string, history: ChatMessage[]) => {
      runRef.current?.abort()
      const controller = new AbortController()
      runRef.current = controller
      const session = useSessionStore.getState()
      let text = ''

      // Ends a stream. A finished or stopped answer counts as one guest action, the same as on the server.
      function finishRun(content: string, status: 'done' | 'stopped', failed = false) {
        if (runRef.current !== controller) {
          return
        }
        runRef.current = null
        if (!failed && useSessionStore.getState().mode === 'guest') {
          useSessionStore.getState().recordGuestAction()
        }
        setStreaming(false)
        setMessages((prev) =>
          prev.map((message) => (message.id === assistantId ? { ...message, content, status } : message)),
        )
      }

      streamAnswer(
        {
          conversationId: storageId,
          content: question,
          history: historyOf(history),
          topicName: title ?? null,
          guestId: session.mode === 'guest' ? session.guestId : null,
        },
        {
          onDelta: (chunk) => {
            text += chunk
            const content = text
            setMessages((prev) => prev.map((message) => (message.id === assistantId ? { ...message, content } : message)))
          },
        },
        controller.signal,
      )
        .then((outcome) => finishRun(text, outcome === 'done' ? 'done' : 'stopped'))
        .catch((error: unknown) => {
          // A refused or failed answer is not counted as a guest action. The server does not count it either.
          if (error instanceof ApiError && error.code === 'KUOTA_HABIS') {
            session.markGuestLimitReached()
          }
          const message = error instanceof Error ? error.message : 'Jawaban belum bisa dibuat. Coba lagi.'
          finishRun(text || message, 'stopped', true)
        })
    },
    [storageId, title],
  )

  useEffect(() => {
    if (initial.streamingId !== null && initialQuestion) {
      runStream(initial.streamingId, initialQuestion, initial.history)
    }
    return () => {
      runRef.current?.abort()
      runRef.current = null
    }
  }, [initial.streamingId, initial.history, initialQuestion, runStream])

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
    runStream(assistantId, question, messages)
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
    runStream(assistantId, question, messages.slice(0, index))
  }

  // A question can become a topic on Learning. The name comes from the question, so the user can rename it later.
  async function makeTopic(question: string) {
    const name = topicNameFromQuestion(question)
    if (name === '') {
      setTopicNotice({ tone: 'error', text: 'Pertanyaan ini terlalu pendek untuk dijadikan nama neuron.' })
      return
    }
    try {
      await createTopic(name)
      await queryClient.invalidateQueries({ queryKey: ['topics'] })
      setTopicNotice({ tone: 'ok', text: `Neuron “${name}” dibuat. Lihat di Learning.` })
    } catch (error) {
      setTopicNotice({ tone: 'error', text: error instanceof Error ? error.message : 'Neuron belum bisa dibuat. Coba lagi.' })
    }
  }

  async function copy(content: string) {
    try {
      await navigator.clipboard.writeText(content)
    } catch {
      // The clipboard can be blocked by the browser. The action then does nothing.
    }
  }

  // A quiz started from this chat replaces the thread until the user goes back to the chat.
  if (chatQuiz?.quizId === storageId) {
    return <ChatQuizPanel quizId={chatQuiz.quizId} settings={chatQuiz.settings} onExit={endChatQuiz} />
  }

  const lastMessage = messages[messages.length - 1]
  const showNextSteps = !streaming && lastMessage?.role === 'assistant' && lastMessage.status === 'done'

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className={clsx('mx-auto flex flex-col gap-3.5', compact ? 'px-3 py-4' : 'max-w-[820px] px-4 py-6 md:px-7')}>
          {messages.length === 0 && emptyText && <p className="text-sm text-muted">{emptyText}</p>}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onCopy={() => void copy(message.content)}
              onRegenerate={() => regenerate(message.id)}
              onCreateQuiz={() => openQuizSetup(storageId)}
              onMakeTopic={isGuest ? undefined : () => void makeTopic(message.content)}
            />
          ))}
          {showNextSteps && <NextStepsCard conversationId={storageId} />}
        </div>
      </div>

      <div className={clsx('mx-auto w-full', compact ? 'px-3 pb-3' : 'max-w-[820px] px-4 pb-4 md:px-7')}>
        {topicNotice && (
          <p role={topicNotice.tone === 'error' ? 'alert' : 'status'} className={clsx('mb-2 text-xs', topicNotice.tone === 'error' ? 'text-red-700' : 'text-brand-dark')}>
            {topicNotice.text}
          </p>
        )}
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
