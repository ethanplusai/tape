# TAPE

**Touch. Play. Repeat.** A four-layer loop instrument you can play in your browser, and an open development study for the physical T—01 Session Deck.

![TAPE T—01 product concept](public/product/session-blue-v8.webp)

Built by [Ethan](https://x.com/ethanplusai). Product images are generated concept imagery. The web audio demo works; the physical instrument is not in production, and this project takes no orders or payments.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run build
npm start
```

Open **http://127.0.0.1:4293**. Audio requires HTTPS or localhost. There are no runtime dependencies, API keys, database or accounts.

## Play

1. Press the blue **Play** key, or the hero's **Play the deck** button. Layer 1 starts with a synthesized base rhythm; layer 2 is selected for recording.
2. Press **Record**, allow your microphone and make a sound. Use headphones to keep the speakers out of your recording.
3. Press a bottom dial to choose a layer, turn it to mix, or hold it to mute.
4. Turn the main dial for BPM. **Press** opens a menu; **turn** browses; **press** enters or confirms. Hold or Escape goes back.
5. Choose **SOUND** for DUST, PULSE, HALF, WARM or OFF. Only layer 1 changes. A recorded layer requires replacement confirmation.
6. Drag the disc in either direction to scrub a layer. Sweep the arm inward to filter it. Release the disc to rejoin the timeline.
7. **SESSION → SAVE** downloads an editable `.tape` project. **EXPORT** downloads a mixed WAV. Save before reloading.

Use **Inspect controls** and **Layers** to enlarge the product. Keyboard users can Tab to controls, use arrows to turn, Enter to press and Shift+Enter to hold. [Complete controls and limitations](docs/controls.md).

## Privacy

Mic audio stays in browser memory. It is never uploaded, logged or transmitted by this application. Mic access ends after a take, cancellation, standby or hiding/leaving the tab. Projects and WAV files download directly to your device. Reloading loses unsaved work. The disc animates on arrival; sound and microphone access require a user action.

There is no analytics code, advertising, account system or audio backend in this repository. Ordinary hosting access logs are controlled by the host. The build-updates link opens Ethan's separate newsletter site, where its own signup flow applies.

## Check the work

```sh
npm test
npm run audit:public
npm run build
npx playwright install chromium
# In another terminal: npm start
npm run test:browser
```

DSP tests measure PCM capture, overdub/undo, tempo, amplitude, reverse, filtering and scrubbing. Project tests validate round-tripping and malformed input. Browser tests use a **synthetic microphone**, real pointer/touch interactions and the actual AudioWorklet, and write ignored screenshots to `test-results/`.

A synthetic input test is not a physical microphone latency or sound-quality measurement. Test representative phones, headphones and interfaces before relying on the demo for performance.

## Product research

- [Engineering and manufacturing study](docs/hardware/research.md)
- [Supplier brief and validation gates](docs/hardware/rfq.md)
- [Cost inputs](docs/hardware/cost-inputs.json) and [calculated scenarios](docs/hardware/cost-results.csv)
- [Visual assembly and reference consistency](docs/design/assembly.md)

```sh
npm run hardware:model
```

The $1,999 working price and 500-unit scenario are assumptions, not a fixed offer. The cost study distinguishes manufacturer specifications from unquoted allowances. No supplier has been contacted and no physical performance has been validated.

## Structure

```text
public/tape-audio/   Sample-clock DSP, AudioWorklet, local file formats and original presets
public/product/      Approved photographic product layers
public/*.css         TAPE styling and fixed photographic projections
public/tape-session.js  Physical controls, menus, audio lifecycle and motion
scripts/             Static build, development server, audit and cost calculations
tests/               PCM, file-format, cost-model and browser checks
docs/                Controls, design assembly and physical-product research
```

`dist/` is generated. The build copies `public/` and `docs/`; everything in those directories is public. Do not put credentials, recordings, private correspondence or working notes there.

## Deploy

The included `vercel.json` builds a static site with `npm run build` and serves `dist/`. Create a dedicated Vercel project from this repository. The build uses Vercel’s production-domain variable for canonical, social-image and sitemap URLs. Set `SITE_ORIGIN` to override it, or when deploying to another host. A custom domain also needs the DNS record Vercel supplies. The site can run on any HTTPS static host with JavaScript module MIME types.

## Contributions and licensing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the visual and audio invariants. Source code and original synthesized preset code are MIT licensed. TAPE branding, product imagery and other creative assets are excluded from that license; see [ASSETS.md](ASSETS.md). Font licenses are included with the font files. Hardware documentation is a concept study, not an open-hardware manufacturing release.
