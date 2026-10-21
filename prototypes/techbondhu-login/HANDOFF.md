# TechBondhu login prototype handoff

## Direction comparison

| Direction | Theme fit | Implementation | Performance | Mobile | Accessibility | Gimmick risk |
| --- | --- | --- | --- | --- | --- | --- |
| A. Semi-realistic white gaming PC | Strong product credibility, but visually louder than the homepage | High difficulty: realistic masking, reflections, and aligned photographic states | Lowest: multiple large photoreal layers and expensive compositing | Moderate: detail becomes muddy at small sizes | Moderate: animation needs an equivalent text/status layer | Medium-high if lighting or realism dominates the form |
| B. Technical exploded view | Excellent technical storytelling and strongest PC-builder association | Highest difficulty: many coordinate-dependent parts, leader lines, and collision-free labels | Moderate-low: many independently composited assets | Lowest: exploded spacing and captions collapse poorly | Moderate: dense labels add cognitive load | Medium; it can feel like a spec sheet instead of a sign-in flow |
| C. Minimal layered product illustration | Best balance of premium product focus, warmth, and restrained technical detail | Medium: five aligned component groups plus reusable fan rotors | Best: fewer layers, predictable compositing, no 3D runtime | Best: assembly can compress without losing the silhouette | Best: milestones map cleanly to text announcements and reduced-motion states | Lowest when motion stays tied to validation |

**Recommendation:** Direction C. It is distinctive without making authentication feel like a demo reel, and it gives engineering the cleanest path to responsive and reduced-motion parity.

## Required image layers

All assets use transparent PNG backgrounds and live in `public/assets/pc/`.

| Asset | Role | Approximate desktop placement inside `.pc-stage` |
| --- | --- | --- |
| `case.png` | Always-visible empty white chassis | `left: 9%`, `top: -4%`, `width: 82%`, `height: 112%` |
| `motherboard.png` | Email-focus install | `left: 29%`, `top: 13%`, `width: 39%`, `height: 67%` |
| `cpu-ram.png` | Valid-email install | `left: 40%`, `top: 25%`, `width: 23%`, `height: 34%` |
| `gpu.png` | Password-focus install | `left: 22%`, `top: 51%`, `width: 50%`, `height: 30%` |
| `cooler-fans.png` | Valid-password install | `left: 32%`, `top: 13%`, `width: 48%`, `height: 64%` |
| `fan-rotor.png` | Reused four times above the cooler/fan housings while submitting | CPU rotor plus three front rotor positions declared in `styles.css` |

For production, export the component groups from one shared 3D scene so perspective, light direction, and occlusion are pixel-aligned. Keep the current generated layers as prototype assets.

## Animation triggers

| Trigger | Visual response | UI status |
| --- | --- | --- |
| Initial | Empty case only | `1 / 5 installed` |
| Email receives focus or content | Motherboard enters from the left | `2 / 5 installed` |
| Email matches a basic address pattern | CPU and two RAM sticks settle vertically | `3 / 5 installed` |
| Password receives focus or content | GPU enters from the right | `4 / 5 installed` |
| Password has 8+ characters, a letter, and a number | Cooler and fans enter | `5 / 5 installed` |
| Valid submit | Rotor images rotate slowly; button and stage announce running checks | `Running checks` |
| Success | Rotors stop; restrained blue case edge light appears | `Build complete · System ready` |
| Authentication error | All installed components remain; one red diagnostic light pulses | `Diagnostic alert` |

The prototype returns an error for any valid email containing `error` (for example `error@techbondhu.com`). Any other valid email plus a valid password reaches success. This is intentionally frontend-only.

## Motion

- Component travel: `420ms cubic-bezier(.22, .8, .3, 1)`.
- Blue success light: `500ms ease` opacity transition.
- Rotor loading speed: one turn every `3.2s`, linear.
- Diagnostic pulse: `1.25s ease-in-out`.
- Travel distance: 28–50 CSS pixels depending on component size.
- No spring or bounce; each milestone is one direct install movement.
- Reduced motion: the visible Motion toggle and `prefers-reduced-motion` both collapse movement to an 80ms state change and suppress repeated animation.

## Responsive behavior

- Desktop (`>1000px`): 54/46 split, product stage left and form right.
- Compact desktop/tablet (`781–1000px`): narrower product column, scaled stage, form remains beside it.
- Mobile (`≤780px`): the product stage becomes a 332px header above the form; component labels hide but the five-step status remains.
- Small mobile (`≤430px`): stage compresses to 305px and social buttons stack.
- The form stays in document flow on mobile so validation messages cannot hide primary actions.

## Form validation and states

- Email validates on a simple `name@domain.tld` pattern.
- Password validates only at the milestone level: at least 8 characters, one letter, and one number. Animation never responds to individual character count.
- Empty/invalid submission exposes inline, programmatically associated field errors.
- Submit loading disables only the primary button and uses an `aria-live` assembly status.
- Success and error each use icon, copy, and color; neither relies on color alone.
- Show/hide password has a dynamic accessible label.
- Remember me uses a real checkbox with a custom visible control and keyboard focus ring.
- Google and GitHub are interactive prototype paths that complete the build immediately; production wiring is intentionally out of scope.

## Key files

- `src/App.jsx` — validation, assembly state machine, form and status behavior.
- `src/styles.css` — layout, component positions, motion, mobile and reduced-motion behavior.
- `public/assets/pc/` — generated transparent PC layers.
- `design-qa.md` — current visual-verification status.
