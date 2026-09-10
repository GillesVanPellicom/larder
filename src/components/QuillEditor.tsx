import { useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

interface QuillEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  className?: string
  disabled?: boolean
}

// Exactly the user-requested options: B, I, U, multiple types of lists, link.
const TOOLBAR_OPTIONS = [
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
  ['link'],
]

function normalizeQuillHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<span class="ql-ui"[^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<p><br\s*\/?><\/p>|<p><\/p>/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function setQuillContent(quill: Quill, html: string) {
  const trimmed = (html || '').trim()
  if (!trimmed || trimmed === '<p><br></p>' || trimmed === '<p></p>') {
    quill.setText('', 'silent')
  } else {
    quill.setText('', 'silent')
    quill.clipboard.dangerouslyPasteHTML(0, trimmed, 'silent')
  }
}

export function QuillEditor({
  value,
  onChange,
  placeholder = 'Type recipe instructions, preparation method, notes, or tips...',
  minHeight = '220px',
  className = '',
  disabled = false,
}: QuillEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  const isInternalChangeRef = useRef(false)
  const onChangeRef = useRef(onChange)
  const lastEmittedValueRef = useRef<string>(value || '')
  const initialValueRef = useRef(value || '')

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Initialize Quill instance
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Prevent duplicate toolbars on React StrictMode remounts
    container.innerHTML = ''

    const editorElement = document.createElement('div')
    container.appendChild(editorElement)

    const quill = new Quill(editorElement, {
      theme: 'snow',
      placeholder,
      readOnly: disabled,
      modules: {
        toolbar: TOOLBAR_OPTIONS,
      },
    })

    quillRef.current = quill

    if (initialValueRef.current) {
      setQuillContent(quill, initialValueRef.current)
      lastEmittedValueRef.current = quill.getSemanticHTML().trim()
    }

    // Ensure Quill does not steal focus automatically on mount
    quill.blur()
    if (quill.root && typeof quill.root.blur === 'function') {
      quill.root.blur()
    }

    const handleTextChange = (_delta: unknown, _oldDelta: unknown, source: string) => {
      if (isInternalChangeRef.current || source !== 'user') return
      const isQuillEmpty = quill.getText().trim() === ''
      const cleanValue = isQuillEmpty ? '' : quill.getSemanticHTML().trim()
      lastEmittedValueRef.current = cleanValue
      onChangeRef.current(cleanValue)
    }

    quill.on('text-change', handleTextChange)

    return () => {
      quill.off('text-change', handleTextChange)
      quillRef.current = null
      container.innerHTML = ''
    }
  }, [placeholder, disabled])

  // Sync external value updates (e.g. discard or switching recipe) without breaking cursor or state
  useEffect(() => {
    const quill = quillRef.current
    if (!quill || isInternalChangeRef.current) return

    if (value === lastEmittedValueRef.current) return

    const currentSemantic = quill.getSemanticHTML()
    if (normalizeQuillHtml(currentSemantic) !== normalizeQuillHtml(value)) {
      isInternalChangeRef.current = true
      setQuillContent(quill, value)
      lastEmittedValueRef.current = (value || '').trim()
      isInternalChangeRef.current = false
      quill.blur()
    }
  }, [value])

  // Sync disabled / readOnly state
  useEffect(() => {
    const quill = quillRef.current
    if (!quill) return
    quill.enable(!disabled)
  }, [disabled])

  return (
    <div
      className={`quill-editor-wrapper rounded-xl overflow-hidden border border-border bg-card text-card-foreground shadow-2xs transition-colors ${className}`}
      style={{ '--quill-min-height': minHeight } as React.CSSProperties}
    >
      <div ref={containerRef} className="quill-container-host" />
    </div>
  )
}
