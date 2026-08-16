import { useEffect, useId, useRef, useState } from 'react'

interface Props {
  src: string
  alt: string
  caption: string
  credit?: string
  className?: string
  eager?: boolean
  width: number
  height: number
}

export function EvidenceFigure({ src, alt, caption, credit, className = '', eager = false, width, height }: Props) {
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const assetUrl = `${import.meta.env.BASE_URL}${src}`

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    const trigger = triggerRef.current
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      trigger?.focus()
    }
  }, [open])

  return (
    <>
      <figure className={`evidence-figure ${className}`.trim()}>
        <button
          ref={triggerRef}
          type="button"
          className="evidence-trigger"
          aria-label={`Open figure: ${caption}`}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          <img src={assetUrl} alt={alt} width={width} height={height} loading={eager ? 'eager' : 'lazy'} />
          <span className="evidence-expand" aria-hidden="true">Expand</span>
        </button>
        <figcaption><span>{caption}</span>{credit && <small>{credit}</small>}</figcaption>
      </figure>

      {open && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <div className="lightbox-panel">
            <button ref={closeRef} type="button" className="lightbox-close" onClick={() => setOpen(false)} aria-label="Close enlarged figure">×</button>
            <img src={assetUrl} alt={alt} width={width} height={height} />
            <div className="lightbox-caption">
              <strong id={titleId}>{caption}</strong>
              <p id={descriptionId}>{credit ?? 'Project evidence from the verified final-report source.'}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
