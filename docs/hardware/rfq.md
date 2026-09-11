# T—01 supplier brief and verification package

Status: draft for review, not a purchase order. No supplier has received this brief.

## Quote package to prepare

A quote-ready release needs STEP assemblies and individual parts, dimensioned 2D drawings with datums/tolerances/finish callouts, Gerbers and PCB stack-ups, assembly BOM with exact MPNs and approved substitutions, firmware/test versions, packaging specification, annual and first-run quantities, shipping destination/terms and acceptance procedures. These files do not yet exist; the generated exterior imagery is a visual reference only.

## Request to prospective engineering/manufacturing partners

Quote 100, 500 and 1,000 good units separately. Break out engineering, fixtures, tooling, recurring components, assembly, test, packaging, freight and taxes/duties. Identify quotation validity, currency, payment milestones, minimum order quantities, lead times, tooling ownership, warranty scope and exclusions. State which prices assume a particular country or shipping term. Include the assumptions rather than a single all-in number.

For mechanics, compare a machined upper shell plus formed lower body against a predominantly formed-metal alternative that retains the exterior proportions. Quote the motor/spindle as a tested subassembly. Identify flatness/runout capability, bearing life, coating yield and cosmetic inspection standards. Quote finish samples before the full shell.

For electronics, quote the non-wireless CM5002016 configuration explicitly, audio bridge, codec, low-noise analog stages, four captured channels, four playback channels, control board, ESD/protection and USB-C PD power. Flag component lifecycle and availability risks. Alternative parts require engineering approval and revalidation.

For final assembly, include programming, serial ID, sensor calibration, audio tests with motor running, control checks, cosmetic inspection, an appropriate burn-in sample plan and packing. Document expected first-pass yield and responsibility for defective parts. Do not accept a cost based on 100% yield.

For tooling and IP, identify every fixture and drawing delivered, its ownership and the cost of transfer to another factory. Production substitutions must be documented before use.

## Validation matrix

| Area | Test | Initial target / record |
| --- | --- | --- |
| Audio continuity | Four maximum-length stereo layers, playback/control edits and saves for eight hours | Zero underruns; log max callback time, CPU and memory |
| Audio latency | Physical analog loopback with impulse/oscilloscope, 64 and 128 frame modes | Target <10 ms round trip; publish measured distribution and settings |
| Analog quality | Noise, THD+N, frequency response, crosstalk at chosen levels and loads | Establish actual product targets after preamp prototype; do not reuse codec typical figures |
| Motor interference | Compare outputs and mic captures with motor off, idle, touched, stalled and reversing | No objectionable audible artifacts; save spectra and listening results |
| Disc sensing | Reference angular motion through wrap, slow movement, touch and reversal | No direction inversion or discontinuity; record error, lag and jitter |
| Motor safety | Stall, missing MCU heartbeat, overcurrent and repeated touch takeover | Bounded torque and safe stop independent of application process |
| Arm | Left/right-handed reach, bypass, saved-value pickup and fast disc gestures | No collisions or unexpected filter jumps; documented participant tasks |
| Controls | Push, rotation, hold, rapid changes, switch bounce and endurance | No accidental confirmation from turning; lifetime target to agree before selection |
| Display | Actual-size panel, normal room light and stage lighting | Menus readable at playing distance; no dependence on tiny render text |
| Storage | Save under full load, near-full media, abrupt interruption, corrupted project | Last complete save survives; invalid files rejected without losing current session |
| Power | Supply negotiation, unplug/replug, brownout, phantom switching | Muted outputs during failure; no project or filesystem corruption |
| Thermal | Full workload + motor + phantom in intended ambient range | Stable operation and acceptable touch temperatures; limits set with safety engineer |
| EMC / ESD | Pre-scan, then applicable lab test plan on assembled device | Lab-defined pass; report model, revision, configuration and region |
| Mechanics | Disc runout, repeated hand load, feet grip and transport restraint | Numeric drawing tolerances derived from feasibility measurements |
| Packaging | Representative shipping drops and vibration with restrained disc/arm | Working device and acceptable finish afterward; define lab procedure before quote |
| Pilot production | Small run from production tooling and intended assembly process | Track yield/rework; every unit passes fixture and final functional test |

## Evidence log format

For every test, record date, unit serial, PCB/mechanical/firmware revisions, equipment and calibration, procedure, operating conditions, acceptance criterion, raw output, result and corrective action. Keep failed runs. An amended design invalidates any test it could materially affect.

## Release gates

1. Audio and mechanical proofs pass; record actual cost and performance.
2. Integrated engineering units pass thermal, power, storage and audio tests.
3. Near-production units pass agreed lab and durability tests.
4. Pilot confirms yield and reproducible factory tests.
5. Publish a fixed offer only after the cost model includes binding quotes, a real schedule, regional fulfillment and support capacity.

Current funding, price and dimensions remain planning assumptions until these gates replace estimates with evidence.
