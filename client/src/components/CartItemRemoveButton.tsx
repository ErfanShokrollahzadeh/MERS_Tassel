'use client';

import { useState } from 'react';
import { LoaderCircle, Trash2 } from 'lucide-react';
import { useCartStore } from '@/stores/cart';
import { useI18n } from '@/i18n/I18nProvider';

type CartItemRemoveButtonProps = {
  itemId: number;
  name: string;
};

/** Keeps removal behavior and its visual treatment consistent wherever a cart line is shown. */
export function CartItemRemoveButton({ itemId, name }: CartItemRemoveButtonProps) {
  const remove = useCartStore((state) => state.remove);
  const { t } = useI18n();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await remove(itemId);
    } finally {
      setIsRemoving(false);
    }
  };

  const label = t('cart.remove', { name });

  return (
    <button
      type="button"
      className="cart-item-remove"
      onClick={() => void handleRemove()}
      disabled={isRemoving}
      aria-label={label}
      title={label}
    >
      {isRemoving ? <LoaderCircle className="spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
      <span>{t('cart.removeAction')}</span>
    </button>
  );
}
