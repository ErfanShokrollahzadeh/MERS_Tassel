'use client';

import { GalleryHorizontal, PanelTop } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

export type SurfacePlacement = 'floor' | 'wall';

export function SurfacePlacementPicker({ value, options, onChange }: {
  value: SurfacePlacement;
  options: SurfacePlacement[];
  onChange: (value: SurfacePlacement) => void;
}) {
  const { t } = useI18n();
  if (options.length < 2) return null;
  return <fieldset className="surface-picker"><legend>{t('model.chooseSurface')}</legend><div>
    {options.includes('floor') && <button type="button" className={value === 'floor' ? 'active' : ''} aria-pressed={value === 'floor'} onClick={() => onChange('floor')}><PanelTop size={16} /><span>{t('model.surfaceFloor')}<small>{t('model.surfaceFloorCopy')}</small></span></button>}
    {options.includes('wall') && <button type="button" className={value === 'wall' ? 'active' : ''} aria-pressed={value === 'wall'} onClick={() => onChange('wall')}><GalleryHorizontal size={16} /><span>{t('model.surfaceWall')}<small>{t('model.surfaceWallCopy')}</small></span></button>}
  </div></fieldset>;
}
