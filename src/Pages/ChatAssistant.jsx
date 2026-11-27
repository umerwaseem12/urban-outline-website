
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Send, X } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const STORAGE_KEY = 'urban-outline-chat'
const MAX_SAVED_MESSAGES = 50

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  text: 'Assalamualaikum! Welcome to Urban Outline. How can I help you with your shopping today?',
}

function createMessageId() {
  return globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function loadMessages() {
  try {
    const saved = JSON.parse(
      sessionStorage.getItem(STORAGE_KEY) || 'null',
    )

    if (Array.isArray(saved)) {
      const valid = saved.filter(
        (message) =>
          message &&
          typeof message.id === 'string' &&
          typeof message.text === 'string' &&
          (message.role === 'user' || message.role === 'assistant'),
      )

      if (valid.length > 0) return valid.slice(-MAX_SAVED_MESSAGES)
    }
  } catch {
    // Storage unavailable: start a fresh conversation.
  }

  return [WELCOME_MESSAGE]
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default function ChatAssistant({ products = [], onOpenProduct }) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState(loadMessages)

  const logRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const log = logRef.current

    if (log) {
      log.scrollTop = log.scrollHeight
    }
  }, [messages, loading, isOpen])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages.slice(-MAX_SAVED_MESSAGES)),
      )
    } catch {
      // Ignore storage errors.
    }
  }, [messages])

  const productMatcher = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) {
      return null
    }

    const byName = new Map()

    products.forEach((product) => {
      if (product?.name) {
        const key = product.name.toLowerCase()

        if (!byName.has(key)) {
          byName.set(key, product)
        }
      }
    })

    const names = [...byName.keys()].sort(
      (a, b) => b.length - a.length,
    )

    if (names.length === 0) return null

    return {
      byName,
      regex: new RegExp(
        `(${names.map(escapeRegExp).join('|')})`,
        'gi',
      ),
    }
  }, [products])

  function renderAssistantText(text) {
    if (!onOpenProduct || !productMatcher) {
      return text
    }

    return text.split(productMatcher.regex).map((part, index) => {
      const product = index % 2 === 1
        ? productMatcher.byName.get(part.toLowerCase())
        : null

      if (!product) return part

      return (
        <button
          key={`${product.id}-${index}`}
          type="button"
          onClick={() => {
            setIsOpen(false)
            onOpenProduct(product)
          }}
          className="font-semibold text-[#db7657] underline underline-offset-2 transition-opacity hover:opacity-80"
        >
          {part}
        </button>
      )
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const text = input.trim()

    if (!text || loading) return

    const userMessage = {
      id: createMessageId(),
      role: 'user',
      text,
    }

    const nextMessages = [...messages, userMessage]

    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const conversation = nextMessages
        .filter(
          (message) =>
            message.id !== 'welcome' &&
            !message.isError &&
            !message.failed,
        )
        .slice(-12)
        .map(({ role, text }) => ({ role, text }))

      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversation,
        }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result.reply) {
        throw new Error(
          result.message ||
          result.error ||
          'Could not reach the assistant. Please try again.',
        )
      }

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          text: result.reply,
        },
      ])
    } catch (error) {
      const friendlyText =
        error instanceof TypeError
          ? 'Could not reach the assistant. Please check your connection and try again.'
          : error.message ||
            'Could not reach the assistant. Please try again.'

      setMessages((current) => [
        ...current.map((message) =>
          message.id === userMessage.id
            ? { ...message, failed: true }
            : message,
        ),
        {
          id: createMessageId(),
          role: 'assistant',
          isError: true,
          text: friendlyText,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[45] sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            aria-label="Urban Outline shopping assistant"
            className="absolute bottom-16 right-0 flex h-[min(520px,70vh)] w-[min(360px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border border-[#db7657] bg-[var(--surface)] text-[var(--page-fg)] shadow-2xl"
          >
            {/* Chat header */}
            <div className="flex items-center justify-between bg-[#201f1c] px-4 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#db7657] bg-[#201f1c]">
                  <img
                    src="/chatbot.jpg"
                    alt=""
                    className="h-full w-full scale-[1.55] object-cover"
                  />
                </div>

                <div>
                  <h2 className="text-sm font-bold">
                    Urban Outline Assistant
                  </h2>

                  <p className="mt-1 text-xs text-white/70">
                    Your shopping companion
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="rounded-full p-2 transition-colors hover:bg-white/10"
              >
                <X size={19} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={logRef}
              role="log"
              aria-live="polite"
              className="flex-1 space-y-3 overflow-y-auto bg-[var(--page-bg)] p-4"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user'
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-6 ${
                      message.role === 'user'
                        ? 'border border-[#db7657] bg-[#201f1c] text-white shadow-[0_0_12px_rgba(219,118,87,0.35)]'
                        : message.isError
                          ? 'border border-red-400/50 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
                          : 'border border-[#db7657]/60 bg-[var(--surface)] text-[var(--page-fg)] shadow-[0_0_10px_rgba(219,118,87,0.2)]'
                    }`}
                  >
                    {message.role === 'assistant' && !message.isError
                      ? renderAssistantText(message.text)
                      : message.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div
                  className="flex justify-start"
                  role="status"
                  aria-label="Assistant is typing"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1 rounded-full border border-[#db7657]/60 bg-[var(--surface)] px-3 py-2 shadow-[0_0_10px_rgba(219,118,87,0.2)]"
                  >
                    {[0, 1, 2].map((dot) => (
                      <motion.span
                        key={dot}
                        className="block h-1.5 w-1.5 rounded-full"
                        animate={{
                          y: [0, -4, 0],
                          scale: [1, 1.3, 1],
                          opacity: [0.4, 1, 0.4],
                          backgroundColor: [
                            '#b9b4ab',
                            '#db7657',
                            '#b9b4ab',
                          ],
                        }}
                        transition={{
                          duration: 1.1,
                          repeat: Infinity,
                          delay: dot * 0.16,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </motion.div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 border-t border-[var(--line)] p-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={1000}
                placeholder="Ask about our products..."
                aria-label="Your message"
                className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[var(--page-bg)] px-3 py-3 text-sm text-[var(--page-fg)] outline-none focus:border-[#db7657]"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#db7657] text-white transition-colors hover:bg-[#bd5d3e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>

            {/* <p className="px-4 pb-3 text-center text-[10px] text-[var(--muted)]">
              Please do not share passwords or sensitive information in chat.
              Your messages are sent to Google Gemini to generate replies.
            </p> */}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Chat icon */}
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? 'Close assistant' : 'Open assistant'}
        aria-expanded={isOpen}
        className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-[#db7657] bg-[#201f1c] text-white shadow-xl transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#db7657] sm:h-[72px] sm:w-[72px]"
      >
        {isOpen ? (
          <ChevronDown size={25} />
        ) : (
          <img
            src="/chatbot.jpg"
            alt=""
            className="h-full w-full scale-[1.55] object-cover"
          />
        )}
      </button>
    </div>
  )
}
