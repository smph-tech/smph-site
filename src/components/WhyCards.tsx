import { WHY_ICONS } from './icons';
import { content } from '@/content';

export function WhyCards() {
  return (
    <div className="cards3">
      {content.why.map((w) => (
        <div className="wc" key={w.title}>
          <div className="ico">{WHY_ICONS[w.icon]}</div>
          <h3>{w.title}</h3>
          <p>{w.text}</p>
        </div>
      ))}
    </div>
  );
}
