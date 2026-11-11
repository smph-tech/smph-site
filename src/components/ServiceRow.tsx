import Image from 'next/image';
import { Button } from './Button';
import { TickBlue } from './icons';
import { IMAGE_SIZE, serviceHref, type Service } from '@/content/services';
import { SERVICES_PAGE } from '@/content/pages';

/** One zig-zag row on the services overview. Even rows put the image on the right. */
export function ServiceRow({ service, index }: { service: Service; index: number }) {
  const size = IMAGE_SIZE[service.image]!;
  return (
    <div className="zz">
      <div
        className="zimg"
        style={{ background: service.cardGradient, order: index % 2 ? 2 : undefined }}
      >
        <Image
          src={service.image}
          alt=""
          width={size.w}
          height={size.h}
          sizes="(max-width: 900px) 80vw, 480px"
        />
      </div>
      <div>
        <div className="mono" style={{ fontSize: 13, letterSpacing: '.1em', color: '#3552DC' }}>
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
        <Button href={serviceHref(service.slug)} arrow style={{ marginTop: 30 }}>
          {SERVICES_PAGE.explore} {service.name.toLowerCase()}
        </Button>
      </div>
    </div>
  );
}
