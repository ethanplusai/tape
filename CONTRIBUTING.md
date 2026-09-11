# Contributing to TAPE

Keep changes focused and describe the user-visible behavior and relevant verification. Do not replace the photographic controls with drawn approximations or change the product layout without an explicit design decision.

## Invariants

- The main dial turns to browse and presses to enter. A drag release must not activate a menu item.
- Library choices, replacement confirmation and all musical settings stay on the hardware display and controls. Do not add a floating library, modal browser or external mixer.
- All audio capture is local. Do not add recording uploads, tracking or accounts as incidental changes.
- Capture runs on the sample clock. Animation frames must not schedule audio.
- The sound library and legacy base sounds are original synthesis. Do not add uncleared music samples.
- The rotating dial faces and disc are circular in their source plane. Rotate first, then apply a fixed perspective projection. Their photographed barrels stay still.
- Layer dials stay aligned and clear of the disc. Keep the exact approved transport key imagery and legends consistent.
- Pointer controls have no decorative focus outline; keyboard focus remains visible. Respect reduced motion.
- State what hardware is proposed versus measured. Do not turn a component's typical specification or an estimate into a finished-product claim.

Run `npm test` for audio or model changes. For control, responsive or motion changes, also run `npm run test:browser` against the built local server and review the screenshots. Run `npm run audit:public` before publishing. Never commit `.env`, deployment credentials, recordings, saved user sessions or personal working files.
