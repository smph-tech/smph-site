import Image from 'next/image';
import { TEAM, PHOTO_SIZE } from '@/content/team';

/** Name and role only, in the order given in content.json. */
export function TeamGrid() {
  return (
    <ul className="tm" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {TEAM.map((p) => {
        const size = PHOTO_SIZE[p.photo]!;
        return (
          <li className="tc" key={p.name}>
            <Image
              src={p.photo}
              alt={`Portrait of ${p.name}, ${p.role}`}
              width={size.w}
              height={size.h}
              sizes="(max-width: 520px) 100vw, (max-width: 1000px) 50vw, 300px"
            />
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
