/** Four-step row on a light background (service pages). */
export function StepRow({ items }: { items: readonly { title: string; text: string }[] }) {
  return (
    <ol className="stg" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map((s, i) => (
        <li className="sq" key={s.title}>
          <div className="b" aria-hidden="true">
            {String(i + 1).padStart(2, '0')}
          </div>
          <h3>{s.title}</h3>
          <p>{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
