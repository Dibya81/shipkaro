"use client";

import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isMuted, setMuted, subscribeSound } from "@/lib/rope-sound";

/** Mute switch for the theme rope's sounds. */
export function SoundToggle() {
  const muted = useSyncExternalStore(subscribeSound, isMuted, () => false);
  const Icon = muted ? VolumeX : Volume2;
  return (
    <button
      type="button"
      aria-pressed={!muted}
      onClick={() => setMuted(!muted)}
      className="inline-flex min-h-11 items-center gap-1.5 text-soft transition-colors hover:text-fg"
    >
      <Icon className="size-4" aria-hidden />
      {muted ? "Sound off" : "Sound on"}
    </button>
  );
}
