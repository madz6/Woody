'use client'

import {
  FormEvent,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

export type IntentInputHandle = {
  focus: () => void
  clear: () => void
}

interface Props {
  onSubmit: (intent: string) => void
  loading: boolean
  className?: string
  placeholder?: string
}

export const IntentInput = forwardRef<IntentInputHandle, Props>(function IntentInput(
  { onSubmit, loading, className = '', placeholder },
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')

  const clear = useCallback(() => setValue(''), [])

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear,
  }))

  function submitIntent() {
    const t = value.trim()
    if (!t || loading) return
    onSubmit(t)
  }

  function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    submitIntent()
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      className={`flex items-center gap-2 bg-bark border border-white/5 rounded-2xl px-4 py-3 focus-within:border-white/10 transition-colors pointer-events-auto ${className}`}
    >
      <svg
        className="text-text-lo flex-shrink-0"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        ref={inputRef}
        className="flex-1 min-w-0 bg-transparent text-sm text-text-hi placeholder:text-text-lo outline-none font-sans"
        placeholder={placeholder ?? "late night drive, glossy, no sad piano..."}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={loading}
        enterKeyHint="send"
        name="intent"
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-sans text-text-hi bg-white/[0.06] border border-white/[0.08] hover:border-white/15 hover:bg-white/[0.09] disabled:opacity-35 disabled:pointer-events-none transition-colors"
      >
        Send
      </button>
    </form>
  )
})
