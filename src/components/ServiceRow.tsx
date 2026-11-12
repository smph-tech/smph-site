import Image from 'next/image';
import { Button } from './Button';
import { TickBlue } from './icons';
import { ToolPills } from './Tools';
import { SCENE_SIZE, serviceHref, type Service } from '@/content/services';
import { SERVICES_PAGE } from '@/content/pages';

/** One alternating row on the services overview. Even rows put the image on the right. */
export function ServiceRow({ service, index }: { service: Service; index: number }) {
  return (
    <div className="zz" id={service.anchor}>
      <div
        className="zimg"
        style={{ background: service.gradient, order: index % 2 ? 2 : undefined }}
      >
        <Image
          src={service.scene}
          alt={`${service.name} illustration`}
          width={SCENE_SIZE.w}
          height={SCENE_SIZE.h}
          sizes="(max-width: 900px) 92vw, 540px"
        />
      </div>
      <div>
        <div
          className="mono"
          style={{ fontSize: 13, letterSpacing: '.1em', color: service.text, fontWeight: 600 }}
        >
          {String(index + 1).padStart(2, '0')} &nbsp;/&nbsp; {service.name.toUpperCase()}
        </div>
        <h2>&ldquo;{service.problem}&rdquo;</h2>
        <p className="lead">{service.short}</p>
        <ul>
          {service.builds.slice(0, 3).map((b) => (
            <li key={b.title}>
              <TickBlue />
              <span>{b.title}</span>
            </li>
          ))}
        </ul>
        <ToolPills names={service.tools.slice(0, 4)} />
        <Button href={serviceHref(service.slug)} arrow style={{ marginTop: 30 }}>
          {SERVICES_PAGE.explore} {service.name.toLowerCase()}
        </Button>
      </div>
    </div>
  );
}
