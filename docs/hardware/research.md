# TAPE T—01: a physical instrument worth building

Engineering direction and manufacturing economics · 10 September 2026

**Decision:** proceed to two small feasibility prototypes, before committing to production tooling or a crowdfunding launch. The proposed product is a four-layer, standalone digital looper with a motorized performance disc, four push-encoders, three transport keys and an expression arm. Preserve the approved exterior; prove the mechanisms inside it.

The browser is a working interaction prototype. The product photographs are generated concept imagery. There is no working physical T—01, supplier quotation, validated circuit board, manufacturing-ready CAD or certification behind this report. Specifications below are design targets unless explicitly attributed to a component manufacturer. Calculations are reproducible in the accompanying model; they are not test measurements.

## Decisions at a glance

| Question | Working decision | Confidence / next evidence |
| --- | --- | --- |
| What is it? | An immediate four-layer looper for voice, instruments and line sources | Workflow demonstrated in the browser; usability with musicians still to test |
| What is the disc for? | Touch, hold, slow and scrub the selected layer while the other layers continue | Audio behavior demonstrated; motor feel and sensor performance untested |
| What is the arm for? | A selected-layer low-pass filter, with an outward bypass region | Browser DSP works; physical reach, clearance and pickup behavior need a mockup |
| Core electronics | CM5 with 2 GB RAM / 16 GB eMMC; separate USB audio bridge and codec | Plausible documented building blocks; their integration has not been built |
| Audio target | 48 kHz, 24-bit converters, four stereo layers, float processing | Architecture target, not an achieved audio specification |
| First enclosure | Machined aluminum upper shell, formed coated steel base | Preserves the design and avoids a large enclosure mold before demand is known |
| Working price | **$1,999**, before tax and delivery | Demand hypothesis; $1,799 leaves much less margin for errors |
| First production planning case | **500 units** | No orders, demand evidence or production commitment |
| Funding planning case | About **$900,000 gross**, only if the base assumptions hold | Not a live goal; quote-backed reforecast required before launch |

## 1. Define the instrument before adding features

The intended customer is a musician or curious maker who wants to capture an idea quickly and physically play with it. TAPE should earn a premium through feel, sound, immediacy and reliability. A large specification list does not establish those qualities.

A successful first session is simple: start a rhythm, select an empty layer, record a phrase, adjust the layer levels, manipulate one layer with the disc and arm, then save. The product should remain useful without an account, subscription, phone or network connection.

The first hardware release should support four stereo layers, overdubbing, one undo level per layer, mute, reverse, a metronome, optional count-in, variable loop lengths, selected-layer filtering and local project saving. Pitch changes with playback speed in the first implementation. Pitch-preserving time stretching adds CPU load, latency and artifacts and should require a separate listening test before it is promised.

Leave battery power, Wi-Fi, Bluetooth, cloud sync, a plug-in marketplace and computer audio-interface mode outside the first release. This is a scope decision: they each consume physical space, test time and firmware work that the central performance interaction needs first.

### What the browser actually proves

The current browser engine records mono PCM from a microphone into four independent layers, mixes them to stereo, changes readhead speed with tempo, supports signed disc scrubbing, applies a low-pass filter, and saves editable projects and mixed WAV files locally. Its four starting rhythms are synthesized locally, with no third-party music samples.

The browser does **not** establish stereo input routing, an analog noise floor, end-to-end latency on an embedded board, a motor's acoustic noise, thermal limits, electrostatic discharge tolerance or power-loss-safe storage. Those must be measured on hardware.

## 2. Minimal controls, complete hierarchy

The front surface retains four equally spaced layer dials, three cobalt transport keys, one main dial, the small display, the output wheel, disc and arm. No fader bank or auxiliary control panel is proposed.

| Control | Press | Turn / movement | Hold |
| --- | --- | --- | --- |
| Layer dial 1–4 | Select that layer | Adjust that layer's level | Mute / unmute |
| Record | Arm or finish a take | — | — |
| Play | Play / pause | — | Stop and rewind |
| Undo | Undo selected layer edit | — | Redo |
| Main dial | Open menu / enter highlighted option / confirm a value | Tempo on home screen; selection or value inside a menu | Back |
| Output wheel | Display output value in the browser | Master level | — |
| Performance disc | Touch takeover | Signed movement scrubs selected layer | Hold freezes that layer |
| Expression arm | — | Selected-layer filter, outward bypass | — |

The amber screen has a home tempo view and a menu context line. MAIN contains SOUND, LOOP, INPUT, SESSION, HELP and EXIT. SOUND changes layer 1's foundation. LOOP contains length, count-in, click and reverse. SESSION contains save, load, export, clear and new. Destructive actions require an explicit confirmation, with Cancel selected first.

The browser uses a dead zone before a pointer drag counts as turning. Releasing a drag does not activate a menu item. An ordinary press, including small hand movement, activates the current item once. Touch and keyboard use the same hierarchy. This interaction also has an existing physical precedent: RANE describes turning its encoder to choose a torque setting and pressing to confirm it. That establishes a familiar control pattern, not evidence that our particular layout has passed a usability test. [RANE encoder interaction](https://support.rane.com/en/support/solutions/articles/69000865031-rane-performer-adjusting-motor-torque)

For hardware, debounce the switch, derive turns from encoder transitions and detect holds on an independent timer. A detent must not synthesize a push. Start with approximately 600 ms for hold and test this with musicians. Prevent an accidental destructive action when a long press is released.

A real arm cannot jump to the stored filter position of a newly selected layer. Use **pickup**: keep the stored sound until the hand moves the arm through that layer's saved value. Show a direction hint on the display until it catches. Do not hide the mismatch by adding an unbudgeted motorized arm.

## 3. Electronics architecture

```text
Mic preamp + switchable 48 V ─┐
Hi-Z instrument input ───────┼─ ADC / codec ─ I2S or TDM ─ USB audio bridge ─┐
Stereo line input ───────────┘                                               │
                                                                            CM5
Balanced stereo outputs ◄──── analog stages ◄─ DAC / codec ◄─ USB bridge ────┤
Independent headphones ◄───── headphone amp                                │
                                                                            │
Five push-encoders, keys, wheel ─┐                                          │
Disc angle + capacitive touch ──┼─ control MCU / watchdog ─ control messages ┤
Arm angle sensor ───────────────┘                                          │
Motor driver ◄─ torque request / touch interlock                            │
Amber display ◄────────────────────────────────────────────────────────────┤
16 GB eMMC: system + projects; USB-A: backup ◄───────────────────────────────┘

External USB-C PD supply → protected input → separate motor, digital and analog rails
```

### Why CM5 is the leading candidate

Raspberry Pi lists a 2.4 GHz quad-core Cortex-A76 processor, several RAM/eMMC options, USB connectivity and a 55 × 40 mm module outline. Its current product page states production through at least January 2036. These are useful integration and supply-life facts; none guarantees our real-time audio workload. [CM5 product information](https://www.raspberrypi.com/products/compute-module-5/)

The current Rev 8 brief lists **CM5002016, non-wireless 2 GB / 16 GB eMMC, at $92.50**, before tax and import duties. Older briefs listed lower prices. The model uses the newer figure and includes a higher-cost stress case. Recheck the exact orderable part, availability and revision before purchasing. [CM5 Rev 8 product brief](https://pip-assets.raspberrypi.com/categories/944-raspberry-pi-compute-module-5/documents/RP-008181-DS-8-cm5-product-brief.pdf) [Manufacturer's memory price update](https://www.raspberrypi.com/news/more-memory-driven-price-rises/)

An embedded Linux system needs a read-only system partition, controlled services, an audio process with appropriate real-time scheduling, bounded allocations in the audio path and an independently monitored watchdog. The production engine should be native code, with browser tests and audio fixtures serving as behavioral references. Shipping a Chromium browser inside the product is not the proposed architecture.

### Why not simply use a small microcontroller?

Electro-Smith's Daisy platform documents a 480 MHz Cortex-M7, 64 MB SDRAM and stereo 24-bit / 96 kHz converters. It is attractive for a compact DSP prototype. Its memory is the limiting factor for the long stereo sessions proposed here; advertised module variants also need care when comparing prices. [Daisy platform](https://electro-smith.com/daisy/daisy)

At 48 kHz, four five-minute stereo float buffers require:

`4 layers × 2 channels × 48,000 frames/s × 300 s × 4 bytes = 460,800,000 bytes`

One undo snapshot for each layer doubles that to **921.6 MB**. Allowing 512 MiB for the OS and 128 MiB for workspace gives approximately **1.593 GB**, leaving about **555 MB** within 2 GiB. These are capacity calculations, not a measured memory profile. Save buffers, undo rotation and DSP scratch must fit inside that allowance; large exports should stream to storage.

Even four one-minute stereo float layers occupy **92.16 MB** before undo or operating overhead. A 64 MB system needs shorter takes, compressed storage, a different undo strategy or active streaming. That tradeoff could still be right for a cheaper product, but it changes the promise. Benchmark both a narrow microcontroller prototype and the proposed CM5 system before freezing the architecture.

### Audio path and integration risk

TI's PCM3168A has six ADC and eight DAC channels, supports I2S/TDM, and offers typical differential ADC SNR of 107 dB and DAC SNR of 112 dB. Its ADC supports up to 96 kHz; DAC up to 192 kHz. TAPE would target 48 kHz. Those chip specifications do not become finished-product specifications: preamps, grounding, power, connectors and layout affect results. [TI PCM3168A](https://www.ti.com/product/PCM3168A)

Do not assume a Linux codec driver means a CM5 carrier can immediately handle the desired multichannel stream. A separate XMOS USB audio bridge is the budgeted route. XMOS documents a multichannel reference design with analog I/O and a USB audio software stack. Its reference performance is encouraging, but its published low-latency example is not a measurement of a TAPE board or a Linux host. The exact codec control, clocking and channel map need implementation. [XMOS multichannel reference](https://www.xmos.com/documentation/XM-014727-PC/html/doc/rst/index.html) [XU316 application hardware](https://www.xmos.com/documentation/XM-008854-UG/html/doc/rst/app_316_mc.html)

Prototype first with a Pi/CM5 development board and a class-compliant USB audio interface. This answers whether the DSP, storage and controls meet their budget without waiting for the custom analog board. Then validate the bridge and codec on the actual electronics.

### Initial input/output targets

- One combination mic input with switchable 48 V phantom power and a suitable low-noise preamp.
- One separate high-impedance instrument input.
- A stereo line input pair, with explicit input selection/routing.
- Balanced left/right line outputs and an independent stereo headphone output.
- USB-A for project backup and firmware recovery media; USB-C for external power.

These imply four captured analog channels and four playback channels. Gain ranges, impedance, maximum input level, headphone load and output level remain to be chosen and tested. Avoid advertising those values until the analog circuit and measurements exist. Do not label the USB power connector as a computer audio interface.

## 4. The disc: make the motion earn its place

A motorized surface is technically plausible. RANE's ONE MKII documents motorized 7.2-inch acrylic discs, torque settings and slip components; its SYSTEM ONE establishes a current standalone motorized product category. These products validate a class of mechanism, not the cost, dimensions or reliability of ours. [RANE ONE MKII](https://support.rane.com/en/support/solutions/articles/69000867558-rane-one-mkii-frequently-asked-questions) [RANE SYSTEM ONE](https://support.rane.com/en/support/solutions/articles/69000874996-rane-system-one-frequently-asked-questions)

The starting target is a 200 mm performance disc, with a nominal 180 g moving mass. Use a low-speed motor, a quiet bearing/spindle and an independently sensed disc position. A direct-drive motor offers a simple relationship between hand and surface, but a carefully designed belt/coupling could be quieter. Build and listen to both options before claiming direct drive.

The web animation maps eight beats to a revolution: 40–240 BPM gives 5–30 rpm. Retaining that mapping makes one turn musically meaningful. The exact relationship can change after player testing; the disc's purpose is interaction, not imitation of a vinyl playback speed.

For the proposed mass and radius, inertia is `I = ½mr² = 0.0009 kg·m²`. Reaching 30 rpm in 0.5 seconds requires only about **0.0057 N·m** of ideal acceleration torque. That excludes friction and contact forces. A mere 1 N tangential hand force at the rim produces **0.1 N·m**. Selecting a motor solely from spin-up inertia would be a serious error.

Detect touch independently. Reduce or remove drive torque during takeover and impose a current/torque ceiling in the motor controller, not only in Linux software. Use a watchdog that cuts the motor if control messages stop. Test holding, release, reversal, stalled operation and repeated interruptions. Keep gaps and arm clearances from creating pinch points.

### Position sensing

Infineon lists AS5048A as a contactless 14-bit absolute angle sensor with SPI/PWM interfaces and a 0.5° accuracy figure. Its digital resolution is `360 / 16384 = 0.02197°`; that is **not** 0.02197° accuracy. Magnet alignment, gap, calibration and nearby motor fields matter. [AS5048A manufacturer page](https://www.infineon.com/part/AS5048A)

Start with a mechanically centered magnet and a separate sensor mount. Compare reported angle against a reference at slow, fast and reversing motion. Evaluate motor magnetic interference across drive currents. Unwrap the angle across zero, preserve signed displacement and smooth noise with a known time constant. An initial 1 kHz sensing target is an engineering choice, not an achieved rate or guarantee of scratch quality.

The pass condition is perceptual and measurable: predictable slow movement, no reversed direction near zero, no sudden phase jump on release and no motor noise leaking into recordings. The alternative is a passive weighted disc with the same sensing. If a quiet motor cannot fit the cost and power budget, test whether users prefer that fallback before abandoning the product.

## 5. Materials, packaging and manufacture

The current enclosure envelope is **310 × 245 × 62 mm**, with approximately **2–3 kg** overall mass. These are packaging targets inferred from the visual direction. The arm may rise above the enclosure envelope. A CAD stack-up must establish all actual outer dimensions, connector access and shipping dimensions before a spec sheet is frozen.

| Assembly | Proposed material / process | Why / unresolved issue |
| --- | --- | --- |
| Upper body | CNC aluminum, radiused edges, ivory coating | Premium feel; deep machining and finish yield could dominate cost |
| Lower body | Bent steel, graphite powder coat | Weight and stiffness; avoid poorly isolated motor vibration |
| Knob faces | Machined aluminum, bead blast / anodize | Preserve overhead circular faces; retain adequate grip and encoder spacing |
| Keys | PBT caps with consistent legends, supported mechanical switches | Low-volume decoration and light bleed need samples; no ad hoc mixed icon sets |
| Disc | Stable carrier, replaceable textured performance surface | Flatness, inertia and touch detection must work together |
| Arm | Aluminum tube or machined assembly with damped pivot and polymer grip | Maintain the silver silhouette without fragile, rattling joints |
| Feet | Replaceable elastomer | Grip, acoustic isolation and access to service screws |
| Packaging | Printed paperboard with engineered protective inserts | Disc/arm shipping restraint and drop testing are essential |

A machined upper and sheet-metal lower case avoid a major injection mold while demand is uncertain. They are not automatically cheap. Quote alternate wall thicknesses, tool access, finish masking and a formed-metal upper option. Preserve the external proportions while changing internal ribs and mounts for cost.

Xometry describes mold costs varying substantially with complexity, with complex tooling reaching tens of thousands of dollars. It supports treating molding as a volume and geometry decision. It does not price the TAPE enclosure. Its article includes a resin table explicitly dated 2020; that table is not used as a current resin-price source. [Xometry molding cost factors](https://www.xometry.com/resources/injection-molding/injection-molding-cost/)

Design serviceability now: replaceable encoder/control board, screw-mounted motor module, accessible connector boards and a removable power path. Keep adhesives out of routine service joints. Publish exploded service drawings only after the design is established. A photorealistic exterior image is not a substitute for a tolerance stack or manufacturing drawing.

### Thermal and electrical layout

The compute module, power converters and motor share a small metal object. Allocate physical zones and return paths, then verify them. Place sensitive mic circuitry away from motor drive loops. Route analog inputs with appropriate shielding and protection; separate noisy power stages and tie grounds intentionally. Couple compute heat to an internal spreader and chassis while measuring touch temperatures and avoiding a fan if possible.

An external certified supply removes mains conversion from the enclosure; it does not certify the whole product. Start with a 45 W USB-C supply allowance, negotiate the necessary PD rail and derive quiet analog/digital rails. Actual input power, standby behavior, phantom-power consumption and motor peaks determine the final supply. No power or acoustic specification is established yet.

## 6. Cost model: an estimate with visible assumptions

Run `npm run hardware:model` to regenerate [CSV results](cost-results.csv) and [JSON results](cost-results.json) from [editable inputs](cost-inputs.json). All figures are USD, as of 10 September 2026, excluding sales tax and customer delivery. Only the identified compute-module row is anchored to a current manufacturer list price. Every other part, labor, freight and engineering line is an **unquoted allowance**.

| Batch | Case | Landed cost / good unit | Development / tooling / tests | Minimum full-batch price* | Rounded gross funding need |
| --- | --- | --- | --- | --- | --- |
| 100 | Base | $832 | $274,500 | $5,348 | $550,000 |
| 500 | Low | $438 | $181,000 | $1,160 | $600,000 |
| 500 | Base | $654 | $274,500 | $1,743 | $900,000 |
| 500 | High | $1,233 | $465,000 | $3,122 | $1,600,000 |
| 1,000 | Base | $588 | $274,500 | $1,232 | $1,250,000 |

*Minimum price allocates the whole project's cash requirement across a sold-out batch, including fees, support reserve and contingency. It is a break-even planning calculation, not a recommended retail price or a supplier quote.*

### How the calculation works

1. Add components at the chosen quantity. Scalable rows use an assumed multiplier of 1.35 at 100 units, 1.00 at 500 and 0.87 at 1,000. The compute list price and external supply do not receive this assumed volume discount.
2. Add final assembly, functional test and packing labor. PCB SMT assembly is already in its separate electronics row.
3. Divide by expected good-unit yield: `factory cost = (parts + labor) / (1 − scrap rate)`.
4. Add inbound freight and a duty sensitivity reserve. The reserve is **not a tariff rate**; country of origin and classification are unresolved.
5. Multiply landed cost by batch size. Add development, fixtures, prototype revisions, compliance allowance and launch operations.
6. Add 20% contingency to that subtotal.
7. Divide required cash by `1 − 10% fees − 3% support reserve` to find gross receipts required.

Kickstarter charges 5% platform fees and reports roughly 3–5% payment processing. The model conservatively uses 10% combined. The 3% support/returns reserve and 20% contingency are independent planning assumptions, not platform requirements. [Kickstarter fees](https://help.kickstarter.com/hc/en-us/articles/115005028634-What-are-the-fees)

The base non-recurring estimate includes 1,000 firmware hours at $120/hour, 350 electrical hours at $130/hour, 300 mechanical hours at $120/hour and 150 industrial-design hours at $100/hour, plus prototype, fixture, tooling and lab allowances. These are explicit staffing assumptions. They are not evidence a contractor will accept those rates or complete that scope in those hours.

### Price and funding interpretation

At **500 × $1,999**, gross receipts are **$999,500**. After the 10% fee assumption and 3% support reserve, $869,565 remains. The base model requires about **$757,847** including contingency, leaving approximately **$111,718**. This is a project cash buffer, not a net-profit claim: corporate overhead, income taxes and any unlisted costs may consume it.

At $1,799, the same base case leaves only about **$24,718**. That is narrow for an unproven electromechanical product. The $1,999 direction provides more room to learn, while remaining a hypothesis that needs demand testing.

The high case still loses roughly **$488,426** at $1,999 across 500 units. A higher goal alone does not fix unit economics if each reward is underpriced. Reduce cost, revise features or price, provide separately funded development, or stop. Do not cover the gap with assumed future sales.

A rounded **$900,000 gross** goal would cover the base cost model's complete 500-unit run even if fewer than 500 product rewards were claimed. At $1,999 it requires approximately 451 full-price rewards, absent other contributions. That leaves unsold inventory already funded in the modeled production cash. But no launch should use this number until supplier quotes, lab scope and fulfillment costs replace the allowances.

For context, Teenage Engineering currently lists TP–7 at $1,499, while SOMA lists COSMOS at €650 net before applicable charges. These are different instruments. They establish that premium tactile audio tools exist, not that customers will pay $1,999 for TAPE. [TP–7 official store](https://teenage.engineering/store/tp-7) [COSMOS official pricing](https://somasynths.com/cosmos_price-availability/)

## 7. Two feasibility proofs, then an engineering prototype

### Proof A: the audio path

Build a development-board rig with a known USB interface and physical encoders. Implement four stereo loops, input routing, overdub/undo, filtering, disc messages and crash-safe project saving. Reuse deterministic test signals so comparisons are repeatable.

Start at 48 kHz with 64- and 128-frame buffers. At 64 frames, one buffer is 1.33 ms; a capture and playback buffer alone are 2.67 ms. ADC/DAC filters, USB scheduling, host queues and processing add delay. Target **under 10 ms measured round trip** at the intended operating mode; report the actual distribution and configuration rather than adding theoretical buffer times and calling it measured latency.

The rig should run eight hours while looping four full-length stereo tracks, changing controls and saving projects, with zero audio underruns. Log CPU, memory, temperature, maximum callback time and storage stalls. Record an impulse into a two-channel oscilloscope or calibrated interface loopback for true latency. Repeat with phantom power enabled and under maximum motor load once the mechanisms are connected.

### Proof B: the disc and arm

Build a mechanical fixture with the target diameter, interchangeable inertia, two drive options, angle sensing, touch detection and an arm mockup. Test it first without the expensive case. Log position and touch events while listening to a sustained tone and a rhythmic loop.

Measure the torque curve, stop response, position jitter, reversal behavior, acoustic noise near the microphone and electrical contamination at the audio outputs. Compare passive and motorized options blind where possible. Ask at least six loop performers to complete the same tasks; include left- and right-handed users. Six users can expose glaring problems but do not establish broad market preference.

The arm passes only if players can scrub the disc without collision, find bypass and change layers without an unexpected filter jump. If users like the look but avoid the control, its function or placement needs revision.

### Integration gates

| Gate | Evidence required to continue |
| --- | --- |
| Feasibility | Audio stress test and disc/arm tests pass, with recorded results |
| Engineering validation | Integrated custom boards, CAD interference checks, thermal and power tests; at least two revision opportunities budgeted |
| Design validation | Near-production materials, repeated control endurance, ESD/EMC pre-scan, packaging tests, service access, stable firmware |
| Production validation | Small pilot from intended supplier, documented test fixture, measured yield, serial tracking and signed acceptance criteria |
| Launch readiness | Working physical demonstration, quote-backed cost/lead times, demand evidence at intended price, production and support plan |

No fixed shipping date follows from this report. A schedule must come from the actual team, critical component availability, revision outcomes and supplier lead times. The development hours in the cost model cannot be treated as elapsed calendar time.

## 8. Public launch and claims

The current site is a personal prelaunch product page, with a playable browser demo and clearly labeled concept imagery. It takes no orders or payments. Build updates link to Ethan's newsletter; this is not represented as a counted, exclusive TAPE reservation list.

An actual Kickstarter hardware campaign has stricter presentation rules: Kickstarter requires working prototypes and prohibits photorealistic renderings for hardware/product-design projects. The existing generated imagery should not be carried into such a campaign as though it met those rules. Film the real prototype and recheck the platform's current requirements before submission. [Kickstarter hardware rules](https://help.kickstarter.com/hc/en-us/articles/115005134554-What-are-the-rules-for-hardware-and-product-design-projects)

The first market modeled is direct-to-consumer US delivery. FCC rules cover authorization of relevant unintentional radiators; the assembled product needs classification and a test plan with a qualified lab. A compute module or external supply's approvals do not by themselves establish approval of the whole device. The budget is an allowance, not a completed compliance determination. Add jurisdiction-specific requirements before offering other regions. [47 CFR §15.101](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-A/part-15/subpart-B/section-15.101)

Keep public claims modest and useful: four-layer instrument, generated product direction, working web demo, intended physical features, a working price direction and documented next steps. Avoid invented backer counts, launch dates, factory partners, made-up customer quotes, certification marks or guaranteed audio performance.

## 9. Challenge the proposal before spending heavily

**The disc may be decoration with a motor bill.** Test whether the same performance can be done more enjoyably with a passive disc. If the motor primarily creates a compelling visual, decide openly whether that warrants its cost, acoustic risk and power use.

**The arm may make the product harder to play.** The silhouette is strong, but it occupies hand space. A nonfunctional ornament is not enough. Test pickup, clearance and bypass with real players before freezing its pivot or rear height.

**Linux may be overpowered and still unreliable.** Available RAM is not proof of deterministic audio. Test under storage and thermal stress. If a microcontroller handles a narrower feature set much better, consider shorter loops or reduced undo instead of solving every issue with more compute.

**CNC may undermine the target economics.** Quote formed metal and hybrid constructions alongside CNC. Keep the exterior visual language, but be willing to change hidden joints, wall geometry and machining operations.

**The price may reflect our enthusiasm, not customer demand.** Compare responses to $1,499, $1,999 and $2,499 with the same honest prototype demonstration. Ask respondents to choose between realistic alternatives, not merely say whether they like the idea. Track qualified interest and willingness to participate in a paid prototype trial only after such a trial is real. No demand validation has been performed for this report.

**The generated product may be impossible to package exactly.** Place supplier STEP models, fasteners, connectors, human fingers and cable bend radii inside actual CAD. A clean exterior image is a direction, not a bill of materials. Preserve the important visual relationships while revising whatever the physical stack-up disproves.

## 10. What to do next

Use the [RFQ and verification package](rfq.md) to brief an embedded-audio engineer and a mechanical designer. Request competing, itemized quotes once drawings and actual interface requirements exist. No suppliers have been contacted as part of this work.

Start with the two proofs, not production purchases. Maintain a dated evidence log with test configuration, measurements, raw recordings and failed runs. Reforecast the cost model at each gate. If the product cannot deliver a quiet, satisfying disc and reliable low-latency looping within the price people will pay, change the product before asking customers to fund it.

### Source register and uncertainty

Primary manufacturer, platform and regulatory sources are linked beside the claims they support. Checked 10 September 2026. Component pages establish their own capabilities; they do not establish compatibility or finished-product results. Product-store prices are snapshots and may vary by region. The official CM5 brief revision is intentionally named because older files show different prices. No proprietary manufacturing database or supplier quotation was used.

The largest unknowns are willingness to pay, motor feel/noise, analog integration, enclosure machining yield, engineering hours and production yield. The low/base/high cases are deliberately transparent stress cases, **not probability intervals**. Their arithmetic is more certain than their inputs. Replacing those inputs with measurements and quotes is the next stage of the work.
