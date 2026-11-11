import { Rich } from './Rich';

/** Native <details>: keyboard and screen-reader support come with the element. */
export function FaqAccordion({ items }: { items: readonly { q: string; a: string }[] }) {
  return (
    <div>
      {items.map((f) => (
        <details key={f.q}>
          <summary>{f.q}</summary>
          <p>
            <Rich text={f.a} />
          </p>
        </details>
      ))}
    </div>
  );
}
