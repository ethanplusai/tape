# Browser audio startup

The deck stays silent until Play or Record. Spinning vinyl on arrival is a visual invitation, not an audio-autoplay request.

## Startup and interruption handling

`TapeEngine.init()` creates and resumes its AudioContext in the initiating input event, before waiting for the AudioWorklet module to load. The former implementation waited for that network request before resuming. The new ordering preserves the original tap's opportunity to start audio, including on a slow connection. A one-sample silent buffer primes the output in the same event; it contains no audible sound.

On subsequent taps the existing context is resumed immediately. A six-second timeout exposes a retry message instead of leaving startup pending indefinitely, while retaining already-recorded audio. A processor error is reported separately.

Where available, the optional `navigator.audioSession` API selects `playback` for listening and `play-and-record` for microphone capture. It returns to playback after a take, cancellation or permission failure. A short bounded recovery handles interruptions caused by this application's own route changes. Hiding the page or an ordinary interruption still cancels unfinished capture, releases the microphone and pauses transport.

The Audio Session API is feature-detected and remains optional. Its types are defined in the [W3C Audio Session specification](https://www.w3.org/TR/audio-session/). Browser support and routing behavior can differ; choosing a type does not guarantee a particular speaker route or successful playback on every iOS release.

## What was verified

- Node regression tests check resume/prime ordering against deliberately delayed module loading, resumption of an interrupted existing context and cancellation of a pending mic request.
- Chromium runs the real AudioWorklet and measures nonzero output after a Play click. A separate startup check deliberately delays the processor module by 1.4 seconds, without the autoplay-policy override used by the full fake-microphone suite.
- The full Chromium suite exercises a synthetic microphone, capture, overdubbing, playback controls and local project export/restore.
- Desktop Playwright WebKit checks menu operation, pre-play settings, real AudioWorklet output and pausing. It is not an iPhone Safari test.

The reported silent iPhone had Silent Mode off. A mute-switch explanation does not account for that report. The startup changes address a concrete timing weakness, but **physical iPhone playback, microphone routing, return-from-background behavior and device latency still need device validation**. There is no claim that desktop WebKit proves those behaviors.

## Physical-device check

1. Open the HTTPS site in a fresh Safari tab. Confirm the disc moves with no sound or mic prompt.
2. Tap Play once. Confirm the base rhythm is audible, then pause and resume using the photographed Play key.
3. With headphones, record a short layer and listen to it. Cancel a second mic request or take and confirm the mic indicator clears.
4. Switch apps, return and press Play. Confirm existing completed layers remain and sound resumes.
5. Save a session before reloading. If playback fails, record the iOS version, output device and any visible error beneath the hero actions.
