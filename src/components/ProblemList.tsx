/** "You might need this if": three big numbered statements. */
export function ProblemList({ items }: { items: readonly string[] }) {
  return (
    <ol className="cards3 nd-list" style={{ gap: 44, listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map((t, i) => (
        <li className="nd" key={t}>
          <div className="n" aria-hidden="true">
            {String(i + 1).padStart(2, '0')}
          </div>
          <p>{t}</p>
        </li>
      ))}
    </ol>
  );
}
