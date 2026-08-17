'use client';

import { Camera, Mail, MessageCircle, Music2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useSiteSettings } from '@/lib/useSiteSettings';

export function SocialContactLinks({ detailed = false }: { detailed?: boolean }) {
  const { t } = useI18n();
  const { data: settings } = useSiteSettings();
  const whatsappPhone = settings?.whatsappPhone || settings?.contactPhone;
  const whatsappNumber = whatsappPhone?.replace(/\D/g, '');
  const accountName = (url: string | null | undefined, fallback: string) => {
    const segment = url?.split('?')[0].split('/').filter(Boolean).at(-1);
    return segment && !segment.includes('.') ? `@${segment.replace(/^@/, '')}` : fallback;
  };

  const links = [
    { label: t('social.instagram'), value: accountName(settings?.instagramUrl, 'Instagram'), href: settings?.instagramUrl || 'https://www.instagram.com', icon: Camera, external: true },
    { label: t('social.tiktok'), value: accountName(settings?.tiktokUrl, 'TikTok'), href: settings?.tiktokUrl || 'https://www.tiktok.com', icon: Music2, external: true },
    ...(settings?.contactEmail ? [{ label: t('social.email'), value: settings.contactEmail, href: `mailto:${settings.contactEmail}`, icon: Mail, external: false }] : []),
    ...(whatsappNumber ? [{ label: t('social.whatsapp'), value: whatsappPhone, href: `https://wa.me/${whatsappNumber}`, icon: MessageCircle, external: true }] : []),
  ];

  return (
    <div className={`social-contact-links${detailed ? ' social-contact-links--detailed' : ''}`}>
      {links.map(({ label, value, href, icon: Icon, external }) => (
        <a key={label} href={href} aria-label={label} {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}>
          <Icon aria-hidden="true" />
          <span><strong>{label}</strong>{detailed && <small>{value}</small>}</span>
        </a>
      ))}
    </div>
  );
}
