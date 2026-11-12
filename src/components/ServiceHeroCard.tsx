import Image from 'next/image';
import { SCENE_SIZE, type Service } from '@/content/services';

/** The big coloured scene card in the service page hero. This is the page's priority image. */
export function ServiceHeroCard({ service }: { service: Service }) {
  return (
    <div className="svcard" style={{ background: service.gradient }}>
      <Image
        src={service.scene}
        alt={`${service.name} illustration with the tools we use`}
        width={SCENE_SIZE.w}
        height={SCENE_SIZE.h}
        priority
        sizes="(max-width: 900px) 92vw, 540px"
      />
    </div>
  );
}
