import Image from 'next/image';
import Link from 'next/link';
import { ArrowIcon } from './icons';
import { SCENE_SIZE, serviceHref, type Service } from '@/content/services';
import { HOME } from '@/content/pages';
import { cx } from '@/lib/cx';

/** Home bento card: the service's own colour, scene image on top, the problem in the visitor's words. */
export function ServiceBentoCard({
  service,
  index,
  wide,
}: {
  service: Service;
  index: number;
  wide?: boolean;
}) {
  return (
    <Link
      className={cx('bc', wide && 'w3')}
      href={serviceHref(service.slug)}
      style={{ background: service.gradient }}
    >
      <Image
        className="sc"
        src={service.scene}
        alt={`${service.name} illustration with the tools we use`}
        width={SCENE_SIZE.w}
        height={SCENE_SIZE.h}
        sizes={wide ? '(max-width: 900px) 100vw, 580px' : '(max-width: 900px) 100vw, 380px'}
      />
      <div className="num">{String(index + 1).padStart(2, '0')}</div>
      <h3>{service.name}</h3>
      <p>&ldquo;{service.problem}&rdquo;</p>
      <div className="go">
        <i>
          <ArrowIcon />
        </i>
        {HOME.services.cardLink}
      </div>
    </Link>
  );
}
