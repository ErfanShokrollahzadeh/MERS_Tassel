# MERS Liquid Glass design system

## Principles

The visual system combines Istanbul atelier warmth with precise commerce usability. Glass is used to express hierarchy, not as decoration on every surface.

## Surface tiers

| Tier | Use | Blur |
| --- | --- | --- |
| Glass bar | Persistent navigation and toolbars | 18px |
| Glass panel | Floating product context, metrics, command palette | 18px |
| Glass overlay | Cart, editors, modal workflows | 18px with stronger fill |

All tiers have opaque fallbacks. Cards beneath large scrolling regions use solid semantic surfaces to avoid repeated backdrop paints.

## Interaction states

- Primary controls have default, hover, focus-visible, disabled, and submitting states.
- Dialogs and drawers expose `role=dialog`, an accessible name, a scrim close action, and visible close control.
- Status, priority, stock, and trends pair color with words, icons, or shape.
- Reduced-motion users receive instant state transitions.
- Route, gallery, accordion, cart-line and toast transitions share the same transform/opacity motion language.
- Product media keeps a stable aspect ratio and uses a shimmer skeleton until the optimized image has decoded.
- Magnetic pointer feedback is limited to a primary hero action and is disabled for touch and reduced-motion users.

## Tokens

Tokens are declared in `client/src/app/globals.css`. Components consume semantic tokens (`canvas`, `surface`, `ink`, `plum`, `line`) rather than hardcoded theme-specific colors. Light and dark modes override the same vocabulary.
