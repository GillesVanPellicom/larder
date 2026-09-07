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
  const initialValueRef = useRef(value)

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
      quill.root.innerHTML = initialValueRef.current
    }

    const handleTextChange = () => {
      if (isInternalChangeRef.current) return
      const html = quill.root.innerHTML
      // Normalize empty paragraph placeholders to empty string
      const cleanValue =
        html === '<p><br></p>' || html === '<p></p>' || html === '' ? '' : html
      isInternalChangeRef.current = true
      onChangeRef.current(cleanValue)
      isInternalChangeRef.current = false
    }

    quill.on('text-change', handleTextChange)

    return () => {
      quill.off('text-change', handleTextChange)
      quillRef.current = null
      container.innerHTML = ''
    }
  }, [placeholder, disabled])

  // Sync external value updates without resetting cursor position
  useEffect(() => {
    const quill = quillRef.current
    if (!quill || isInternalChangeRef.current) return

    const currentHtml = quill.root.innerHTML
    const normCurrent =
      currentHtml === '<p><br></p>' || currentHtml === '<p></p>' ? '' : currentHtml
    const normNew = value === '<p><br></p>' || value === '<p></p>' ? '' : value

    if (normCurrent !== normNew) {
      isInternalChangeRef.current = true
      quill.root.innerHTML = normNew || ''
      isInternalChangeRef.current = false
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
