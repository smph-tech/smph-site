import Image from 'next/image';
import Link from 'next/link';
import { IMAGE_SIZE, SERVICES, serviceHref } from '@/content/services';

export function OtherServices({ currentSlug }: { currentSlug: string }) {
  return (
    <div className="oc">
      {SERVICES.filter((s) => s.slug !== currentSlug).map((s) => {
        const size = IMAGE_SIZE[s.image]!;
        return (
          <Link
            className="ocard"
            href={serviceHref(s.slug)}
            style={{ background: s.cardGradient }}
            key={s.slug}
          >
            <Image src={s.image} alt="" width={size.w} height={size.h} sizes="200px" />
            <b>{s.name}</b>
            <span>{s.short}</span>
          </Link>
        );
      })}
    </div>
  );
}
