'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Sparkles, X } from 'lucide-react';
import { fetchActivePopups, popupKeys, trackPopupEvent } from '@/lib/popups';
import { api, mediaUrl } from '@/lib/apiClient';
import { useI18n } from '@/i18n/I18nProvider';
import { useToastStore } from '@/stores/toast';
import type { Popup } from '@/types/commerce';

function matchesPath(targetPages?: string | null, currentPath?: string): boolean {
  if (!targetPages || !targetPages.trim() || targetPages.trim() === '*') return true;
  if (!currentPath) return false;

  const patterns = targetPages.split(',').map((p) => p.trim()).filter(Boolean);
  return patterns.some((pattern) => {
    if (pattern === currentPath) return true;
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      return currentPath.startsWith(prefix);
    }
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return currentPath.startsWith(prefix);
    }
    return false;
  });
}

function isCooldownActive(popup: Popup): boolean {
  if (typeof window === 'undefined') return true;
  if (popup.cooldownDays <= 0) return false;

  const dismissedKey = `mers_popup_${popup.id}_dismissed`;
  const convertedKey = `mers_popup_${popup.id}_converted`;

  const dismissedAt = window.localStorage.getItem(dismissedKey);
  const convertedAt = window.localStorage.getItem(convertedKey);

  const now = Date.now();
  const cooldownMs = popup.cooldownDays * 24 * 60 * 60 * 1000;

  if (convertedAt) return true; // Converted popups are permanently suppressed
  if (dismissedAt) {
    const elapsed = now - Number(dismissedAt);
    if (elapsed < cooldownMs) return true;
  }

  return false;
}

export function PopupRenderer() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useI18n();
  const showToast = useToastStore((state) => state.show);

  const [activePopup, setActivePopup] = useState<Popup | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const trackedRef = useRef<Set<number>>(new Set());

  // Disable on admin or special standalone routes
  const isExcludedRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/model-capture') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  const { data: popups } = useQuery({
    queryKey: popupKeys.active({ path: pathname }),
    queryFn: () => fetchActivePopups({ path: pathname }),
    enabled: !isExcludedRoute,
    staleTime: 60 * 1000,
  });

  // Evaluate candidate popup
  useEffect(() => {
    if (isExcludedRoute || !popups || !popups.length) {
      setActivePopup(null);
      setIsOpen(false);
      return;
    }

    const eligible = popups.find(
      (p) => matchesPath(p.targetPages, pathname) && !isCooldownActive(p)
    );

    setActivePopup(eligible ?? null);
    setIsOpen(false);
  }, [isExcludedRoute, pathname, popups]);

  // Handle triggers
  useEffect(() => {
    if (!activePopup || isExcludedRoute) return;

    let timer: number | undefined;

    const trigger = () => {
      setIsOpen(true);
      if (!trackedRef.current.has(activePopup.id)) {
        trackedRef.current.add(activePopup.id);
        void trackPopupEvent(activePopup.id, 'impression');
      }
    };

    if (activePopup.triggerType === 'immediate') {
      timer = window.setTimeout(trigger, 300);
    } else if (activePopup.triggerType === 'delay') {
      const delayMs = Math.max(500, (activePopup.triggerValue || 5) * 1000);
      timer = window.setTimeout(trigger, delayMs);
    } else if (activePopup.triggerType === 'scroll_depth') {
      const targetPercent = Math.max(10, Math.min(95, activePopup.triggerValue || 50));
      const onScroll = () => {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        if (total <= 0) return;
        const current = (window.scrollY / total) * 100;
        if (current >= targetPercent) {
          trigger();
          window.removeEventListener('scroll', onScroll);
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    } else if (activePopup.triggerType === 'exit_intent') {
      const onMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 10) {
          trigger();
          document.documentElement.removeEventListener('mouseleave', onMouseLeave);
        }
      };
      // Only attach exit intent on desktop
      if (window.innerWidth >= 768) {
        document.documentElement.addEventListener('mouseleave', onMouseLeave);
        return () => document.documentElement.removeEventListener('mouseleave', onMouseLeave);
      } else {
        // Mobile fallback: delay 8s
        timer = window.setTimeout(trigger, 8000);
      }
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [activePopup, isExcludedRoute]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const handleDismiss = () => {
    if (activePopup) {
      window.localStorage.setItem(`mers_popup_${activePopup.id}_dismissed`, String(Date.now()));
    }
    setIsOpen(false);
  };

  const handleCopyCode = async () => {
    if (!activePopup?.couponCode) return;
    try {
      await navigator.clipboard.writeText(activePopup.couponCode);
      setCopied(true);
      void trackPopupEvent(activePopup.id, 'conversion');
      window.localStorage.setItem(`mers_popup_${activePopup.id}_converted`, String(Date.now()));
      showToast({
        tone: 'success',
        title: locale === 'tr' ? 'Kupon Kopyalandı' : 'Coupon Copied',
        message:
          locale === 'tr'
            ? `${activePopup.couponCode} ödeme adımında kullanılmaya hazır.`
            : `${activePopup.couponCode} is ready for checkout.`,
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const handlePrimaryClick = () => {
    if (!activePopup) return;
    void trackPopupEvent(activePopup.id, 'click');

    if (activePopup.couponCode) {
      void handleCopyCode();
    }

    if (activePopup.primaryCtaUrl) {
      handleDismiss();
      router.push(activePopup.primaryCtaUrl);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePopup || !email.trim()) return;

    setSubscribing(true);
    try {
      await api.post('/newsletter/subscribe', { email: email.trim(), source: 'popup' });
      void trackPopupEvent(activePopup.id, 'conversion');
      window.localStorage.setItem(`mers_popup_${activePopup.id}_converted`, String(Date.now()));
      showToast({
        tone: 'success',
        title: locale === 'tr' ? 'Abonelik Tamamlandı' : 'Welcome to MERS Tassel',
        message:
          locale === 'tr'
            ? 'Bültenimize kaydoldunuz. Teşekkür ederiz.'
            : 'You are now subscribed to atelier stories and private previews.',
      });
      handleDismiss();
    } catch (err) {
      showToast({
        tone: 'error',
        title: locale === 'tr' ? 'Kayıt Yapılamadı' : 'Could not subscribe',
        message: err instanceof Error ? err.message : '',
      });
    } finally {
      setSubscribing(false);
    }
  };

  if (!activePopup || !isOpen || isExcludedRoute) return null;

  const isTr = locale === 'tr';
  const badge = isTr ? activePopup.badgeTr || activePopup.badge : activePopup.badge;
  const title = isTr ? activePopup.titleTr || activePopup.title : activePopup.title;
  const description = isTr
    ? activePopup.descriptionTr || activePopup.description
    : activePopup.description;
  const primaryCta = isTr
    ? activePopup.primaryCtaTextTr || activePopup.primaryCtaText
    : activePopup.primaryCtaText;
  const secondaryCta = isTr
    ? activePopup.secondaryCtaTextTr || activePopup.secondaryCtaText
    : activePopup.secondaryCtaText;

  const isCenterModal = activePopup.placement === 'center_modal';
  const isBottomBar = activePopup.placement === 'bottom_bar';
  const isSlideIn =
    activePopup.placement === 'slide_in_bottom_right' ||
    activePopup.placement === 'slide_in_bottom_left';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for Center Modal */}
          {isCenterModal && (
            <motion.div
              className="modal-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleDismiss}
              style={{ zIndex: 9998 }}
            />
          )}

          {/* Popup Container */}
          <motion.div
            role="dialog"
            aria-modal={isCenterModal}
            aria-label={title}
            initial={
              isCenterModal
                ? { opacity: 0, scale: 0.94, y: 15 }
                : isBottomBar
                  ? { opacity: 0, y: 60 }
                  : { opacity: 0, x: activePopup.placement === 'slide_in_bottom_left' ? -60 : 60, y: 20 }
            }
            animate={
              isCenterModal
                ? { opacity: 1, scale: 1, y: 0 }
                : isBottomBar
                  ? { opacity: 1, y: 0 }
                  : { opacity: 1, x: 0, y: 0 }
            }
            exit={
              isCenterModal
                ? { opacity: 0, scale: 0.96, y: 10 }
                : isBottomBar
                  ? { opacity: 0, y: 60 }
                  : { opacity: 0, x: activePopup.placement === 'slide_in_bottom_left' ? -60 : 60, y: 20 }
            }
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              zIndex: 9999,
              ...(isCenterModal
                ? {
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 'calc(100vw - 32px)',
                  maxWidth: '480px',
                }
                : isBottomBar
                  ? {
                    bottom: '16px',
                    left: '16px',
                    right: '16px',
                    maxWidth: '840px',
                    margin: '0 auto',
                  }
                  : {
                    bottom: '24px',
                    ...(activePopup.placement === 'slide_in_bottom_left'
                      ? { left: '24px' }
                      : { right: '24px' }),
                    width: 'calc(100vw - 32px)',
                    maxWidth: '380px',
                  }),
            }}
          >
            <div
              className="glass-overlay"
              style={{
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: '0 24px 50px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.14)',
                position: 'relative',
                display: isBottomBar ? 'flex' : 'block',
                alignItems: isBottomBar ? 'center' : 'unset',
                gap: isBottomBar ? '20px' : '0',
                padding: isBottomBar ? '16px 24px' : '0',
              }}
            >
              {/* Close Button */}
              <button
                type="button"
                className="icon-button"
                onClick={handleDismiss}
                aria-label="Close popup"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  zIndex: 2,
                  background: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                }}
              >
                <X size={16} />
              </button>

              {/* Banner Image */}
              {activePopup.imagePath && !isBottomBar && (
                <div style={{ height: isCenterModal ? '160px' : '120px', width: '100%', overflow: 'hidden' }}>
                  <img
                    src={mediaUrl(activePopup.imagePath)}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              {/* Content Body */}
              <div style={{ padding: isBottomBar ? '0' : '24px', flex: isBottomBar ? 1 : 'unset' }}>
                {badge && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      background: 'rgba(212,175,55,0.2)',
                      color: 'var(--accent, #d4af37)',
                      marginBottom: '8px',
                      fontWeight: 600,
                    }}
                  >
                    <Sparkles size={11} /> {badge}
                  </span>
                )}

                <h3
                  style={{
                    fontSize: isBottomBar ? '16px' : '20px',
                    margin: '0 0 6px 0',
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {title}
                </h3>

                {description && (
                  <p
                    style={{
                      fontSize: '13px',
                      lineHeight: 1.5,
                      opacity: 0.82,
                      margin: isBottomBar ? '0' : '0 0 16px 0',
                    }}
                  >
                    {description}
                  </p>
                )}

                {/* Coupon Code Strip */}
                {activePopup.couponCode && (
                  <div
                    onClick={handleCopyCode}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px dashed rgba(255,255,255,0.25)',
                      margin: '12px 0 16px 0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    <span style={{ fontWeight: 700, letterSpacing: '0.06em', fontSize: '15px' }}>
                      {activePopup.couponCode}
                    </span>
                    <button
                      type="button"
                      className="admin-button admin-button--secondary"
                      style={{ padding: '4px 10px', fontSize: '11px', gap: '4px' }}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? (isTr ? 'Kopyalandı' : 'Copied') : isTr ? 'Kodu Kopyala' : 'Copy'}
                    </button>
                  </div>
                )}

                {/* Newsletter Form */}
                {activePopup.type === 'newsletter' && (
                  <form onSubmit={handleNewsletterSubmit} style={{ display: 'flex', gap: '8px', margin: '14px 0' }}>
                    <input
                      type="email"
                      required
                      placeholder={isTr ? 'E-posta adresiniz' : 'Your email address'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'inherit',
                        fontSize: '13px',
                      }}
                    />
                    <button
                      type="submit"
                      className="admin-button admin-button--primary"
                      disabled={subscribing}
                      style={{ padding: '10px 16px', fontSize: '13px' }}
                    >
                      {subscribing ? (isTr ? 'Kaydediliyor…' : 'Joining…') : primaryCta || (isTr ? 'Kayıt Ol' : 'Subscribe')}
                    </button>
                  </form>
                )}

                {/* Call to Actions (Non-newsletter) */}
                {activePopup.type !== 'newsletter' && (primaryCta || secondaryCta) && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: isBottomBar ? 'row' : 'column',
                      gap: '8px',
                      marginTop: '12px',
                    }}
                  >
                    {primaryCta && (
                      <button
                        type="button"
                        className="admin-button admin-button--primary"
                        onClick={handlePrimaryClick}
                        style={{
                          width: isBottomBar ? 'auto' : '100%',
                          padding: '11px 18px',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 600,
                        }}
                      >
                        {primaryCta}
                      </button>
                    )}
                    {secondaryCta && (
                      <button
                        type="button"
                        className="text-button"
                        onClick={handleDismiss}
                        style={{
                          padding: '6px',
                          fontSize: '12px',
                          opacity: 0.7,
                          textAlign: 'center',
                        }}
                      >
                        {secondaryCta}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

