# Play TAPE in your browser

Choose **Learn the controls** in the header for a photographic guide to playback, recording, layers, tempo, the disc, the arm, loop setup, base sounds and saved sessions. **Find this on the deck** brings you to the matching physical control or menu in the hero. This navigation never starts audio or changes recorded layers. During a take, it brings you back to the deck without changing its view or menu.

All musical controls are on the deck. Layer 2 is selected on arrival so you can record over the base on layer 1. Use **Inspect controls** for the right rail or **Layers** for the front row.

| Control | Gesture | Result |
| --- | --- | --- |
| Record dot | Press | Request microphone and capture the selected layer; press again to finish or cancel a pending permission request |
| Play triangle | Press / hold | Play or pause / stop and rewind. Layer 1 starts with the selected base sound; layers 2–4 are yours to record |
| Undo curve | Press / hold | Undo / redo the selected layer's latest audio edit |
| Four small dials | Press / turn / hold | Select that layer / adjust its level / mute or unmute |
| Large right dial | Turn / press | Adjust 40–240 BPM / open or confirm an on-device menu |
| Main dial in a menu | Turn / press / hold | Browse or adjust / choose / go back |
| Right-edge thumbwheel | Turn | Adjust output level |
| Disc | Hold and drag | Hold selected audio and scrub it forward or backward; release to rejoin the common timeline |
| Expression arm | Sweep red grip | Low-pass the selected layer, outward to bypass |
| Black upper-left button | Press | Standby or wake; standby stops audio and releases the microphone |

Keyboard: focus a dial and use arrow keys; Shift multiplies the step by ten. Home/End choose limits. Enter selects a layer or opens the main menu. Shift+Enter on a layer mutes it. Escape goes back in a menu. Disc arrows scrub; Space holds. Native button Enter/Space presses the transport keys; Shift+Enter on Play or Undo accesses Stop or Redo.

## Main dial menu

- **Sound:** DUST, PULSE, HALF, WARM or OFF. Turn to browse; press to apply. Changes only layer 1. Replacing a recorded/overdubbed layer requires confirmation. Undo can restore the previous sound.
- **Loop:** Free / 1 / 2 / 4 bar take length, count-in, metronome, selected-layer reverse.
- **Input:** browser microphone input gain, 0–200%. The browser/OS chooses the input source. No live input monitoring.
- **Session:** Save an editable `.tape` project, Load a saved project, Export a mixed WAV, Clear selected layer, New empty session. Load, Clear and New require confirmation on the deck display.
- **Help:** the push, turn and hold gestures.

Menu transport remains available. Recording closes the menu. During a take, tempo, selection, reverse, scrubbing, file operations and undo are locked to protect capture alignment. Levels, mute, expression and output remain adjustable.

## Recording and saving

A first **Free** take closes exactly when you press Record again, up to 60 seconds. Later free takes follow an existing loop length. A fixed take closes after 1, 2 or 4 bars. Early close of a fixed take pads its uncaptured tail with silence. New layers start at their loop boundary. Count-in adds at least four beats of notice. Recording an occupied layer overdubs it in forward direction. Undo retains up to three audio states per layer; redo is invalidated by a new edit.

Microphone audio is mono, stays in this tab's memory, and is never uploaded. It is not monitored live; use headphones when layering. Mic access ends after a take, cancellation, error, standby or leaving the tab. A hidden tab cancels unfinished capture and pauses playback. Closed takes remain while the page is loaded.

**Save** preserves the four individual PCM tracks, levels, mute, reverse, filter, tempo, output and loop settings in a versioned local `.tape` file. **Load** validates the entire file before replacing audio; it converts the sample rate if needed. No executable content is read. Undo history and an unfinished take are not saved. Reloading without saving loses the session. There is no automatic browser storage.

**Export** renders 16-bit mono PCM WAV for the longest recorded loop, with current tempo, levels, direction, filters and master gain. The metronome is excluded. Loops with unequal, non-multiple lengths may not all end on a boundary in this mix export; keep the editable project as well.

## Implementation and limits

The AudioWorklet runs the same `TapeCore` exercised by PCM tests. One sample clock schedules takes and loop playback. The animation frame clock only moves the photograph. Forward/reverse/scrub use an interpolating sample reader with seam windows, smoothed levels and a short release crossfade. The arm controls a one-pole low-pass filter, and a soft limiter bounds the mix.

Tempo is varispeed: speed and pitch change together. There is no pitch-preserving time stretch, stereo capture, sample import, tap tempo, audio-device picker, latency compensation or live monitoring. A stereo input is downmixed to mono. Microphone/browser/device latency still needs physical-device testing. The browser demo does not prove motor feel, arm clearance, sensor accuracy, electronics or manufacturing feasibility.

Audio requires HTTPS or localhost and AudioWorklet support. Nothing plays or requests a microphone before a user action. Reduced-motion preferences and Pause motion stop automatic disc animation; Play/Pause separately controls sound.

If sound does not start, the page displays an error beneath the hero actions. A fresh Play tap retries audio startup. Browser interruptions pause playback and release the mic; return to the page and press Play to resume. The [browser audio notes](browser-audio.md) document the startup behavior and device-validation limits.
