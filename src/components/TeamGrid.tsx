import Image from 'next/image';
import { TEAM, PHOTO_SIZE } from '@/content/team';
import { cx } from '@/lib/cx';

/**
 * Name and role only, in the order given in content.json.
 * With `linkable` (About page only) the photo, and only the photo, links to the person's LinkedIn.
 */
export function TeamGrid({ linkable = false }: { linkable?: boolean }) {
  return (
    <ul className="tm" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {TEAM.map((p) => {
        const size = PHOTO_SIZE[p.photo]!;
        const photo = (
          <Image
            src={p.photo}
            alt={`Portrait of ${p.name}, ${p.role}`}
            width={size.w}
            height={size.h}
            sizes="(max-width: 520px) 100vw, (max-width: 1000px) 50vw, 300px"
          />
        );
        return (
          <li className={cx('tc', linkable && 'lk')} key={p.name}>
            {linkable ? (
              <a
                className="tl"
                href={p.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${p.name} on LinkedIn`}
              >
                {photo}
                <span className="in" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="12" height="12" focusable="false">
                    <path
                      fill="#fff"
                      d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z"
                    />
                  </svg>
                </span>
              </a>
            ) : (
              photo
            )}
            <div className="cap">
              <div className="nm">{p.name}</div>
              <div className="rl">{p.role}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
