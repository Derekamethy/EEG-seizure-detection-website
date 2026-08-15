interface Props {
  eyebrow: string
  title: string
  copy?: string
}

export function SectionHeading({ eyebrow, title, copy }: Props) {
  return (
    <header className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {copy && <p>{copy}</p>}
    </header>
  )
}
