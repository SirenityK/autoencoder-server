import {
  buildOutArgs,
  getVisualQualityForCrf,
  type EncodeSettings,
  SOCIAL_PRESET_LABELS,
  SOCIAL_PRESETS,
  SocialPreset,
  VISUAL_QUALITY_OPTIONS,
} from "@lib/utils/social-presets";
import BadgeCheck from "lucide-solid/icons/badge-check";
import Clapperboard from "lucide-solid/icons/clapperboard";
import Cpu from "lucide-solid/icons/cpu";
import Gauge from "lucide-solid/icons/gauge";
import Image from "lucide-solid/icons/image";
import MessageCircle from "lucide-solid/icons/message-circle";
import MonitorPlay from "lucide-solid/icons/monitor-play";
import MoveRight from "lucide-solid/icons/move-right";
import Music2 from "lucide-solid/icons/music-2";
import RadioTower from "lucide-solid/icons/radio-tower";
import SlidersHorizontal from "lucide-solid/icons/sliders-horizontal";
import Sparkles from "lucide-solid/icons/sparkles";
import { createMemo, createSignal, For, onCleanup, onMount } from "solid-js";

const CODEC_CARDS = [
  {
    name: "H.264",
    label: "Universal",
    description:
      "Reliable playback for everyday delivery, fast reviews, and broad compatibility.",
    icon: MonitorPlay,
    badge: "safe pick",
  },
  {
    name: "H.265",
    label: "Compact",
    description:
      "Sharper files at smaller sizes when quality and storage both matter.",
    icon: Cpu,
    badge: "efficient",
  },
  {
    name: "AV1",
    label: "Modern",
    description:
      "A forward-looking option for high compression and clean web distribution.",
    icon: Sparkles,
    badge: "next-gen",
  },
  {
    name: "AAC / Opus",
    label: "Audio",
    description:
      "Tuned audio paths for voice, music, and compact social-ready exports.",
    icon: Music2,
    badge: "balanced",
  },
] as const;

const SOCIAL_PRESET_ORDER = [
  SocialPreset.WhatsApp,
  SocialPreset.Instagram,
  SocialPreset.Messenger,
] as const;

const SOCIAL_PRESET_DETAILS = {
  [SocialPreset.WhatsApp]: {
    summary:
      "Compact everyday sharing with capped frame rate and smaller files.",
    icon: MessageCircle,
    accent: "badge-success",
  },
  [SocialPreset.Instagram]: {
    summary: "Full HD social exports tuned for cleaner reels and feed posts.",
    icon: Image,
    accent: "badge-secondary",
  },
  [SocialPreset.Messenger]: {
    summary:
      "Balanced HD clips for chat threads, previews, and quick handoffs.",
    icon: RadioTower,
    accent: "badge-info",
  },
} as const;

function formatArgs(settings: EncodeSettings): string {
  return Object.entries(buildOutArgs(settings))
    .map(([key, value]) => `-${key} ${value}`)
    .join(" ");
}

function formatResolution(settings: EncodeSettings): string {
  return settings.video.resolution === "source"
    ? "Source"
    : `${settings.video.resolution}p`;
}

function visualQualityLabel(settings: EncodeSettings): string {
  const quality = getVisualQualityForCrf({
    crf: settings.video.crf,
    codec: settings.video.videoCodec,
  });
  const option = VISUAL_QUALITY_OPTIONS.find((item) => item.value === quality);
  return option?.label ?? `CRF ${settings.video.crf}`;
}

function presetSettingsLabels(settings: EncodeSettings) {
  return [
    { label: formatResolution(settings), enabled: true },
    { label: visualQualityLabel(settings), enabled: true },
    { label: settings.video.videoCodec, enabled: true },
    { label: `${settings.audio.audioBitrate} kbps audio`, enabled: true },
    { label: settings.outputExtension.toUpperCase(), enabled: true },
  ];
}

function randomPresetIndex(current: number): number {
  if (SOCIAL_PRESET_ORDER.length < 2) return current;

  const next = Math.floor(Math.random() * SOCIAL_PRESET_ORDER.length);
  return next === current ? (next + 1) % SOCIAL_PRESET_ORDER.length : next;
}

export default function Page() {
  const [presetIndex, setPresetIndex] = createSignal(0);
  const activePreset = createMemo(() => SOCIAL_PRESET_ORDER[presetIndex()]);
  const activeSettings = createMemo(() => SOCIAL_PRESETS[activePreset()]);
  const activePresetLabel = createMemo(
    () => SOCIAL_PRESET_LABELS[activePreset()],
  );

  onMount(() => {
    const intervalId = window.setInterval(() => {
      setPresetIndex((current) => randomPresetIndex(current));
    }, 3200);

    onCleanup(() => window.clearInterval(intervalId));
  });

  return (
    <main class="bg-base-100">
      <section class="hero min-h-[calc(100vh-4rem)] bg-base-200 px-4 py-12">
        <div class="hero-content mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 p-0 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)]">
          <div class="max-w-3xl">
            <div class="badge badge-primary badge-lg gap-2">
              <span class="size-2 animate-pulse rounded-full bg-primary-content" />
              Social presets are live
            </div>

            <h1 class="mt-6 text-balance font-black text-5xl leading-none tracking-tight sm:text-6xl lg:text-7xl">
              Turn heavy videos into clean, shareable files.
            </h1>
            <p class="mt-6 max-w-2xl text-base-content/70 text-lg leading-8">
              Optiflow gives creators and teams a focused encoding surface: pick
              a destination preset, adjust quality when needed, and export
              without wrestling with command-line rituals.
            </p>

            <div class="mt-8 flex flex-wrap gap-3">
              <a href="/encode" class="btn btn-primary">
                Open encoder
                <MoveRight class="size-4" />
              </a>
              <a href="#presets" class="btn btn-outline">
                See presets
              </a>
            </div>

            <div class="stats stats-vertical sm:stats-horizontal mt-10 w-full shadow">
              <div class="stat">
                <div class="stat-figure text-primary">
                  <Clapperboard class="size-8" />
                </div>
                <div class="stat-title">Presets</div>
                <div class="stat-value text-2xl">3</div>
                <div class="stat-desc">WhatsApp, Instagram, Messenger</div>
              </div>
              <div class="stat">
                <div class="stat-figure text-secondary">
                  <SlidersHorizontal class="size-8" />
                </div>
                <div class="stat-title">Controls</div>
                <div class="stat-value text-2xl">Precise</div>
                <div class="stat-desc">quality, size, speed</div>
              </div>
            </div>
          </div>

          <div class="w-full">
            <div class="mockup-window border border-base-300 bg-base-300 shadow-2xl">
              <div class="bg-base-100 p-5">
                <div class="card bg-neutral text-neutral-content">
                  <div class="card-body gap-5">
                    <div class="flex items-center justify-between gap-4">
                      <div>
                        <p class="text-neutral-content/60 text-xs uppercase tracking-widest">
                          live preset
                        </p>
                        <h2 class="card-title text-2xl">
                          {activePresetLabel()} export
                        </h2>
                      </div>
                      <BadgeCheck class="size-6 text-success" />
                    </div>

                    <div
                      class="radial-progress mx-auto text-success"
                      style={{ "--value": 71 }}
                    >
                      <span class="font-black text-2xl">71%</span>
                    </div>

                    <progress
                      class="progress progress-success"
                      max="100"
                      value="71"
                    />

                    <div class="mockup-code bg-base-300 text-base-content">
                      <pre data-prefix="$">
                        <code>
                          ffmpeg $IN_ARGS {formatArgs(activeSettings())}
                        </code>
                      </pre>
                      <pre data-prefix=">" class="text-success">
                        <code>
                          {activePresetLabel()} export is almost ready
                        </code>
                      </pre>
                    </div>
                  </div>
                </div>

                <div class="alert alert-info mt-4">
                  <Gauge class="size-5" />
                  <span>
                    Presets set the baseline; advanced controls stay available.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="presets"
        class="flex min-h-screen items-center bg-base-100 px-4 py-16"
      >
        <div class="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-[0.82fr_1fr]">
          <div>
            <div class="badge badge-secondary badge-lg">Preset library</div>
            <h2 class="mt-5 max-w-2xl text-balance font-black text-4xl leading-tight sm:text-5xl">
              Pick the destination, then let Optiflow shape the export.
            </h2>
            <p class="mt-5 max-w-xl text-base-content/70 leading-7">
              The encoder now includes real social presets that select sensible
              resolution, quality, frame-rate, audio, and container defaults
              before you touch advanced settings.
            </p>
          </div>

          <div class="carousel carousel-center w-full gap-4 rounded-box bg-base-200 p-4 shadow-xl">
            <For each={SOCIAL_PRESET_ORDER}>
              {(preset) => {
                const Icon = SOCIAL_PRESET_DETAILS[preset].icon;
                const settings = SOCIAL_PRESETS[preset];
                return (
                  <div class="carousel-item w-80">
                    <div class="card w-full bg-base-100 shadow">
                      <div class="card-body">
                        <div class="flex items-center justify-between gap-3">
                          <div class="avatar placeholder">
                            <div class="grid w-16 place-items-center rounded-full bg-primary text-primary-content">
                              <Icon class="size-8" />
                            </div>
                          </div>
                          <div
                            class={`badge ${SOCIAL_PRESET_DETAILS[preset].accent}`}
                          >
                            {settings.outputExtension.toUpperCase()}
                          </div>
                        </div>
                        <h3 class="card-title mt-3">
                          {SOCIAL_PRESET_LABELS[preset]}
                        </h3>
                        <p class="text-base-content/70 text-sm leading-6">
                          {SOCIAL_PRESET_DETAILS[preset].summary}
                        </p>
                        <div class="mt-2 flex flex-wrap gap-2">
                          <For
                            each={presetSettingsLabels(settings).slice(0, 3)}
                          >
                            {(setting) => (
                              <div class="badge badge-outline">
                                {setting.label}
                              </div>
                            )}
                          </For>
                        </div>
                        <div class="card-actions mt-4">
                          <a href="/encode" class="btn btn-primary btn-sm">
                            Use preset
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </section>

      <section class="flex min-h-screen items-center bg-base-200 px-4 py-16">
        <div class="mx-auto w-full max-w-7xl">
          <div class="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div class="badge badge-accent badge-lg">Featured codecs</div>
              <h2 class="mt-5 text-balance font-black text-4xl leading-tight sm:text-5xl">
                Choose the right engine for the file you need.
              </h2>
            </div>
            <a href="/encode" class="btn btn-primary">
              Try a codec
              <MoveRight class="size-4" />
            </a>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <For each={CODEC_CARDS}>
              {(codec) => {
                const Icon = codec.icon;
                return (
                  <div class="card bg-base-100 shadow">
                    <div class="card-body">
                      <div class="flex items-center justify-between gap-3">
                        <div class="avatar placeholder">
                          <div class="grid w-12 place-items-center rounded-full bg-primary text-primary-content">
                            <Icon class="size-6" />
                          </div>
                        </div>
                        <div class="badge badge-outline">{codec.badge}</div>
                      </div>
                      <h3 class="card-title mt-4">
                        {codec.name}
                        <span class="badge badge-secondary">{codec.label}</span>
                      </h3>
                      <p class="text-base-content/70 text-sm leading-6">
                        {codec.description}
                      </p>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </section>

      <section class="flex min-h-screen items-center bg-base-100 px-4 py-16">
        <div class="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-[0.85fr_1fr]">
          <div>
            <div class="badge badge-primary badge-lg">
              Live settings preview
            </div>
            <h2 class="mt-5 max-w-2xl text-balance font-black text-4xl leading-tight sm:text-5xl">
              Technical when you want it. Friendly when you do not.
            </h2>
            <p class="mt-5 max-w-xl text-base-content/70 leading-7">
              The preset strip explains what is changing without forcing
              everyone to read ffmpeg flags. The command remains there for
              people who want the exact output.
            </p>
          </div>

          <div class="mockup-window border border-base-300 bg-base-300 shadow-2xl">
            <div class="space-y-5 bg-base-100 p-5">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="text-base-content/50 text-xs uppercase tracking-widest">
                    generated args preview
                  </p>
                  <h3 class="font-bold text-2xl">
                    {activePresetLabel()} preset
                  </h3>
                </div>
                <div class="badge badge-success gap-2">
                  <span class="loading loading-ring loading-xs" />
                  rotating presets
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <For each={presetSettingsLabels(activeSettings())}>
                  {(setting) => (
                    <button
                      type="button"
                      class={
                        setting.enabled
                          ? "btn btn-primary btn-sm"
                          : "btn btn-outline btn-sm"
                      }
                    >
                      {setting.label}
                    </button>
                  )}
                </For>
              </div>

              <div class="mockup-code bg-neutral text-neutral-content">
                <pre data-prefix="$">
                  <code>ffmpeg $IN_ARGS {formatArgs(activeSettings())}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
