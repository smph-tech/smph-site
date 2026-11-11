import Image from 'next/image';
import Link from 'next/link';
import { ArrowIcon } from './icons';
import { IMAGE_SIZE, serviceHref, type Service } from '@/content/services';
import { HOME } from '@/content/pages';

export function ServiceBentoCard({
  service,
  index,
  wide,
}: {
  service: Service;
  index: number;
  wide?: boolean;
}) {
  const size = IMAGE_SIZE[service.image]!;
  return (
    <Link
      className={`bc${wide ? 'w3' : ''}`}
      href={serviceHref(service.slug)}
      style={{ background: service.cardGradient }}
    >
      <Image
        className="ic"
        src={service.image}
        alt=""
        width={size.w}
        height={size.h}
        sizes="(max-width: 900px) 300px, 340px"
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
