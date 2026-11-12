import Image from 'next/image';
import Link from 'next/link';
import { SCENE_SIZE, SERVICES, serviceHref } from '@/content/services';

export function OtherServices({ currentSlug }: { currentSlug: string }) {
  return (
    <div className="oc">
      {SERVICES.filter((s) => s.slug !== currentSlug).map((s) => (
        <Link
          className="ocard"
          href={serviceHref(s.slug)}
          style={{ background: s.gradient }}
          key={s.slug}
        >
          <Image
            src={s.scene}
            alt=""
            width={SCENE_SIZE.w}
            height={SCENE_SIZE.h}
            sizes="(max-width: 640px) 45vw, (max-width: 900px) 46vw, 280px"
          />
          <b>{s.name}</b>
          <span>{s.short}</span>
        </Link>
      ))}
    </div>
  );
}
