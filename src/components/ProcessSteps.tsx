import { content } from '@/content';

/** Five-stage timeline on the home page. Step numbers pulse in turn. */
export function ProcessSteps() {
  return (
    <ol className="steps" style={{ marginTop: 72, listStyle: 'none', padding: 0 }}>
      {content.how.map((step, i) => (
        <li className="sp" key={step.name}>
          <div className="b" aria-hidden="true">
            {String(i + 1).padStart(2, '0')}
          </div>
          <h3>{step.name}</h3>
          <p>{step.lead}</p>
        </li>
      ))}
    </ol>
  );
}
