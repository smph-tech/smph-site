import { ArrowIcon } from './icons';
import Link from 'next/link';
import { SERVICES, serviceHref } from '@/content/services';
import { SERVICES_PAGE } from '@/content/pages';

type RowKey = keyof typeof SERVICES_PAGE.compare.rows;

export function CompareTable() {
  const { columns, rows } = SERVICES_PAGE.compare;
  return (
    <div className="tbl">
      <div className="trow h" aria-hidden="true">
        {columns.map((c) => (
          <div key={c}>{c}</div>
        ))}
        <div />
      </div>
      {SERVICES.map((s) => {
        const row = rows[s.slug as RowKey];
        return (
          <Link className="trow" href={serviceHref(s.slug)} key={s.slug}>
            <b>{s.name}</b>
            <div>
              <span className="sr-only">{columns[1]}: </span>
              {row.bestWhen}
            </div>
            <div>
              <span className="sr-only">{columns[2]}: </span>
              {row.get}
            </div>
            <div className="mono" style={{ fontSize: 14 }} data-placeholder="">
              <span className="sr-only">{columns[3]}: </span>
              {s.timeline}
            </div>
            <span className="go" aria-hidden="true">
              <ArrowIcon />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
