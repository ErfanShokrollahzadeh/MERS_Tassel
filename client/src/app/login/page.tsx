'use client';

import Link from 'next/link';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { MediaImage } from '@/components/MediaImage';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useI18n } from '@/i18n/I18nProvider';

export default function LoginPage() {
  const [show, setShow] = useState(false);
  const { t } = useI18n();
  return <div className="auth-page"><div className="auth-visual"><MediaImage src="https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1400&q=88" alt="Handcrafted jewelry detail" sizes="55vw" priority /><Link href="/" className="wordmark wordmark--footer"><span className="wordmark__seal">M</span><span>MERS <i>Tassel</i></span></Link><blockquote>{t('auth.loginQuote')}</blockquote></div><main className="auth-form"><div className="auth-language"><LanguageSwitch /></div><Link href="/" className="auth-mobile-brand">MERS <i>Tassel</i></Link><span className="eyebrow">{t('auth.welcome')}</span><h1>{t('auth.await1')}<br />{t('auth.await2')}</h1><p>{t('auth.loginCopy')}</p><form onSubmit={(event) => event.preventDefault()}><label>{t('checkout.email')}<input type="email" required autoComplete="email" /></label><label>{t('auth.password')}<div><input type={show ? 'text' : 'password'} required autoComplete="current-password" /><button type="button" onClick={() => setShow(!show)} aria-label={t('auth.showPassword')}>{show ? <EyeOff /> : <Eye />}</button></div></label><div className="auth-options"><label><input type="checkbox" /> {t('auth.remember')}</label><a href="#">{t('auth.forgot')}</a></div><Link href="/admin" className="button button--primary button--block">{t('auth.signIn')} <ArrowRight /></Link></form><span className="auth-switch">{t('auth.new')} <Link href="/signup">{t('auth.create')}</Link></span></main></div>;
}
