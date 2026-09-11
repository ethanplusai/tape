# ROOM 01

TAPE's first sound collection lives entirely inside the existing deck controls. Press a bottom dial to select a layer, then use the main dial: **MAIN → SOUND → type → sound**. Turn to browse; press to load. The amber display identifies the target layer. Any sound can go on any layer; the suggested categories for empty layers are drums, bass, chords and texture.

| Type | Sounds | Character |
| --- | --- | --- |
| Drums | DUST / PULSE / BREAK | Swung dry drums, a steady four-beat kick, a lighter broken rhythm |
| Bass | ROUND / WALK / SUB | Sparse warm bass, a moving phrase, sustained low notes |
| Chords | FELT / HAZE / CHOP | Soft electric keys, a slow pad, short syncopated chords |
| Texture | GLASS / SHAKER / SPARK | A bell phrase, swung percussion, a plucked arpeggio |

These are original, deterministic synthesized loops. They contain no sampled commercial recordings, and do not call a generative model or download audio. Musical quality remains a listening and user-testing question; numerical audio tests do not establish that people will enjoy them.

## Musical behavior

All parts are two bars in 4/4 at a native 96 BPM. Tonal parts share an Am9 / Fmaj9 phrase. They render at the same native tempo regardless of the deck's current BPM, then use its shared sample clock. Adding a part after changing tempo therefore keeps it in tune with the other library parts. Tempo still changes pitch: there is no pitch-preserving time stretching. Arbitrary mic recordings or older saved presets are not automatically harmonized to this collection.

The synthesis uses envelopes, original drum patterns, bass notes, voiced chords and timed echoes. Levels are balanced by role with peak limits. The existing layer volume, mute, filter, reverse and disc controls also apply to library audio.

## Replacing and recording

- A confirmed choice replaces only the selected layer. Browsing never changes audio.
- While playing, a sound waits for the next four-beat bar boundary. The display shows QUEUED and the target layer. Swaps use a short crossfade and retain the common phrase position.
- While paused, a choice loads immediately. Pausing also applies queued choices; they are ready when playback resumes.
- OFF empties that layer. Undo cancels a pending choice or restores the prior audio after a swap. Redo restores a committed replacement.
- Replacing mic audio or an overdub asks for confirmation, with Cancel selected first. Library choices remain locked during a take. Wait for a queued choice to land before starting a new recording.
- Recording an occupied library layer overdubs it, marking the resulting audio as a custom recording. The original library part remains available through Undo.
- Save and WAV export capture the currently applied layers. Let queued choices land before saving. Saved `.tape` files preserve each sound's identity and PCM, including older sessions from before the library was added.

Mic recording remains optional. Listening and combining library loops needs no mic permission. Use headphones when recording over playback to keep speaker audio out of subsequent takes. The library avoids that acoustic path; it does not cancel speaker bleed during mic recording.
