import { Link } from "@components/Link";
import type { Translator } from "@lib/i18n";
import { useI18n } from "@lib/i18n/context";
import {
  buildOutArgs,
  getVisualQualityForCrf,
  type EncodeSettings,
  SOCIAL_PRESETS,
  SocialPreset,
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
    labelKey: "home.codecs.cards.h264.label",
    descriptionKey: "home.codecs.cards.h264.description",
    icon: MonitorPlay,
    badgeKey: "home.codecs.cards.h264.badge",
  },
  {
    name: "H.265",
    labelKey: "home.codecs.cards.h265.label",
    descriptionKey: "home.codecs.cards.h265.description",
    icon: Cpu,
    badgeKey: "home.codecs.cards.h265.badge",
  },
  {
    name: "AV1",
    labelKey: "home.codecs.cards.av1.label",
    descriptionKey: "home.codecs.cards.av1.description",
    icon: Sparkles,
    badgeKey: "home.codecs.cards.av1.badge",
  },
  {
    name: "AAC / Opus",
    labelKey: "home.codecs.cards.audio.label",
    descriptionKey: "home.codecs.cards.audio.description",
    icon: Music2,
    badgeKey: "home.codecs.cards.audio.badge",
  },
] as const;

const SOCIAL_PRESET_ORDER = [
  SocialPreset.WhatsApp,
  SocialPreset.Instagram,
  SocialPreset.Messenger,
] as const;

const SOCIAL_PRESET_DETAILS = {
  [SocialPreset.WhatsApp]: {
    summaryKey: "home.presets.details.whatsapp",
    icon: MessageCircle,
    accent: "badge-success",
  },
  [SocialPreset.Instagram]: {
    summaryKey: "home.presets.details.instagram",
    icon: Image,
    accent: "badge-secondary",
  },
  [SocialPreset.Messenger]: {
    summaryKey: "home.presets.details.messenger",
    icon: RadioTower,
    accent: "badge-info",
  },
} as const;

const PRESET_LABEL_KEYS = {
  [SocialPreset.WhatsApp]: "encode.presets.whatsapp",
  [SocialPreset.Instagram]: "encode.presets.instagram",
  [SocialPreset.Messenger]: "encode.presets.messenger",
  [SocialPreset.Custom]: "encode.presets.custom",
} as const;

const VISUAL_QUALITY_LABEL_KEYS = {
  "visually-lossless": "encode.options.visualQuality.visuallyLossless",
  good: "encode.options.visualQuality.good",
  "not-usually-noticeable": "encode.options.visualQuality.notUsuallyNoticeable",
  "low-quality": "encode.options.visualQuality.lowQuality",
  "low-quality-meme": "encode.options.visualQuality.lowQualityMeme",
} as const;

function formatArgs(settings: EncodeSettings): string {
  return Object.entries(buildOutArgs(settings))
    .map(([key, value]) => `-${key} ${value}`)
    .join(" ");
}

function formatResolution(settings: EncodeSettings, t: Translator): string {
  return settings.video.resolution === "source"
    ? t("encode.options.source")
    : `${settings.video.resolution}p`;
}

function visualQualityLabel(settings: EncodeSettings, t: Translator): string {
  const quality = getVisualQualityForCrf({
    crf: settings.video.crf,
    codec: settings.video.videoCodec,
  });
  return quality
    ? t(VISUAL_QUALITY_LABEL_KEYS[quality])
    : `CRF ${settings.video.crf}`;
}

function presetSettingsLabels(settings: EncodeSettings, t: Translator) {
  return [
    { label: formatResolution(settings, t), enabled: true },
    { label: visualQualityLabel(settings, t), enabled: true },
    { label: settings.video.videoCodec, enabled: true },
    {
      label: t("home.preview.audioKbps", {
        bitrate: settings.audio.audioBitrate,
      }),
      enabled: true,
    },
    { label: settings.outputExtension.toUpperCase(), enabled: true },
  ];
}

function randomPresetIndex(current: number): number {
  if (SOCIAL_PRESET_ORDER.length < 2) return current;

  const next = Math.floor(Math.random() * SOCIAL_PRESET_ORDER.length);
  return next === current ? (next + 1) % SOCIAL_PRESET_ORDER.length : next;
}

export default function Page() {
  const { t } = useI18n();
  const [presetIndex, setPresetIndex] = createSignal(0);
  const activePreset = createMemo(() => SOCIAL_PRESET_ORDER[presetIndex()]);
  const activeSettings = createMemo(() => SOCIAL_PRESETS[activePreset()]);
  const activePresetLabel = createMemo(() =>
    t(PRESET_LABEL_KEYS[activePreset()]),
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
              {t("home.hero.badge")}
            </div>

            <h1 class="mt-6 text-balance font-black text-5xl leading-none tracking-tight sm:text-6xl lg:text-7xl">
              {t("home.hero.title")}
            </h1>
            <p class="mt-6 max-w-2xl text-base-content/70 text-lg leading-8">
              {t("home.hero.copy")}
            </p>

            <div class="mt-8 flex flex-wrap gap-3">
              <Link href="/encode" class="btn btn-primary">
                {t("home.hero.openEncoder")}
                <MoveRight class="size-4" />
              </Link>
              <a href="#presets" class="btn btn-outline">
                {t("home.hero.seePresets")}
              </a>
            </div>

            <div class="stats stats-vertical sm:stats-horizontal mt-10 w-full shadow">
              <div class="stat">
                <div class="stat-figure text-primary">
                  <Clapperboard class="size-8" />
                </div>
                <div class="stat-title">
                  {t("home.hero.stats.presetsTitle")}
                </div>
                <div class="stat-value text-2xl">3</div>
                <div class="stat-desc">{t("home.hero.stats.presetsDesc")}</div>
              </div>
              <div class="stat">
                <div class="stat-figure text-secondary">
                  <SlidersHorizontal class="size-8" />
                </div>
                <div class="stat-title">
                  {t("home.hero.stats.controlsTitle")}
                </div>
                <div class="stat-value text-2xl">
                  {t("home.hero.stats.controlsValue")}
                </div>
                <div class="stat-desc">{t("home.hero.stats.controlsDesc")}</div>
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
                          {t("home.hero.livePreset")}
                        </p>
                        <h2 class="card-title text-2xl">
                          {t("home.hero.exportLabel", {
                            preset: activePresetLabel(),
                          })}
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
                          {t("home.hero.readyLine", {
                            preset: activePresetLabel(),
                          })}
                        </code>
                      </pre>
                    </div>
                  </div>
                </div>

                <div class="alert alert-info mt-4">
                  <Gauge class="size-5" />
                  <span>{t("home.hero.alert")}</span>
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
            <div class="badge badge-secondary badge-lg">
              {t("home.presets.badge")}
            </div>
            <h2 class="mt-5 max-w-2xl text-balance font-black text-4xl leading-tight sm:text-5xl">
              {t("home.presets.title")}
            </h2>
            <p class="mt-5 max-w-xl text-base-content/70 leading-7">
              {t("home.presets.copy")}
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
                          {t(PRESET_LABEL_KEYS[preset])}
                        </h3>
                        <p class="text-base-content/70 text-sm leading-6">
                          {t(SOCIAL_PRESET_DETAILS[preset].summaryKey)}
                        </p>
                        <div class="mt-2 flex flex-wrap gap-2">
                          <For
                            each={presetSettingsLabels(settings, t).slice(0, 3)}
                          >
                            {(setting) => (
                              <div class="badge badge-outline">
                                {setting.label}
                              </div>
                            )}
                          </For>
                        </div>
                        <div class="card-actions mt-4">
                          <Link href="/encode" class="btn btn-primary btn-sm">
                            {t("home.presets.usePreset")}
                          </Link>
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
              <div class="badge badge-accent badge-lg">
                {t("home.codecs.badge")}
              </div>
              <h2 class="mt-5 text-balance font-black text-4xl leading-tight sm:text-5xl">
                {t("home.codecs.title")}
              </h2>
            </div>
            <Link href="/encode" class="btn btn-primary">
              {t("home.codecs.cta")}
              <MoveRight class="size-4" />
            </Link>
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
                        <div class="badge badge-outline">
                          {t(codec.badgeKey)}
                        </div>
                      </div>
                      <h3 class="card-title mt-4">
                        {codec.name}
                        <span class="badge badge-secondary">
                          {t(codec.labelKey)}
                        </span>
                      </h3>
                      <p class="text-base-content/70 text-sm leading-6">
                        {t(codec.descriptionKey)}
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
              {t("home.preview.badge")}
            </div>
            <h2 class="mt-5 max-w-2xl text-balance font-black text-4xl leading-tight sm:text-5xl">
              {t("home.preview.title")}
            </h2>
            <p class="mt-5 max-w-xl text-base-content/70 leading-7">
              {t("home.preview.copy")}
            </p>
          </div>

          <div class="mockup-window border border-base-300 bg-base-300 shadow-2xl">
            <div class="space-y-5 bg-base-100 p-5">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="text-base-content/50 text-xs uppercase tracking-widest">
                    {t("home.preview.generatedArgs")}
                  </p>
                  <h3 class="font-bold text-2xl">
                    {t("home.preview.presetLabel", {
                      preset: activePresetLabel(),
                    })}
                  </h3>
                </div>
                <div class="badge badge-success gap-2">
                  <span class="loading loading-ring loading-xs" />
                  {t("home.preview.rotating")}
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <For each={presetSettingsLabels(activeSettings(), t)}>
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
