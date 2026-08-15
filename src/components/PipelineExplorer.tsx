import { useState } from 'react'
import pipelineData from '../data/pipeline.json'
import type { PipelineStage } from '../types/project'

const pipeline = pipelineData as PipelineStage[]

export function PipelineExplorer() {
  const [activeId, setActiveId] = useState(pipeline[0].id)
  const [technical, setTechnical] = useState(false)
  const active = pipeline.find((stage) => stage.id === activeId) ?? pipeline[0]

  return (
    <div className="pipeline-explorer">
      <div className="segmented-control" aria-label="Explanation level">
        <button type="button" className={!technical ? 'active' : ''} onClick={() => setTechnical(false)}>Overview</button>
        <button type="button" className={technical ? 'active' : ''} onClick={() => setTechnical(true)}>Technical details</button>
      </div>
      <div className="pipeline-strip" role="list" aria-label="Detection pipeline">
        {pipeline.map((stage, index) => (
          <div className="pipeline-step-wrap" key={stage.id} role="listitem">
            <button
              type="button"
              className={`pipeline-step ${stage.id === active.id ? 'active' : ''}`}
              aria-pressed={stage.id === active.id}
              onClick={() => setActiveId(stage.id)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {stage.label}
            </button>
            {index < pipeline.length - 1 && <span className="pipeline-arrow" aria-hidden="true">→</span>}
          </div>
        ))}
      </div>
      <article className="pipeline-detail" aria-live="polite">
        <div>
          <p className="detail-kicker">Selected stage</p>
          <h3>{active.label}</h3>
          <p>{technical ? active.technical : active.overview}</p>
        </div>
        {technical && (
          <dl>
            <div><dt>Output</dt><dd>{active.shape}</dd></div>
            <div><dt>Implementation</dt><dd><code>{active.implementation}</code></dd></div>
          </dl>
        )}
      </article>
    </div>
  )
}
