import { cn, pollUntilDone, uploadFileToPresignedUrl } from "@lib/utils";
import {
  AudioCodec,
  AV1,
  ColorDepth,
  Decoder,
  FrameRate,
  Preset,
  Resolution,
  type Tune,
  VideoCodec,
} from "@lib/utils/ffmpeg";
import {
  AUDIO_DESCRIPTORS,
  buildOutArgs,
  cloneSettings,
  type EncodeSettings,
  getVisualQualityCrf,
  getVisualQualityForCrf,
  markMatchingSocialPreset,
  socialPresetSettings,
  SOCIAL_PRESET_LABELS,
  SocialPreset,
  VIDEO_DESCRIPTORS,
  VISUAL_QUALITY_OPTIONS,
  type VisualQuality,
} from "@lib/utils/social-presets";
import {
  ErrorVariant,
  type LocalStorageData,
  type ServerResponse,
  Status,
} from "@lib/utils/types";
import { makePersisted } from "@solid-primitives/storage";
import MoveRight from "lucide-solid/icons/move-right";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  Match,
  Show,
  Switch,
} from "solid-js";
import { createStore } from "solid-js/store";
import { objectEntries, objectValues } from "ts-extras";
import type { Entries } from "type-fest";
import { ClientOnly } from "vike-solid/ClientOnly";
import {
  onCheckJobStatus,
  onEncodeVideo,
  onRequestDownload,
  onRequestUpload,
} from "./+Page.telefunc";

// ─── Data Maps ────────────────────────────────────────────────────────────────

const VIDEO_CODEC_LABELS: Record<VideoCodec, string> = {
  [VideoCodec.H264]: "H.264 (libx264)",
  [VideoCodec.H265]: "H.265 (libx265)",
  [VideoCodec.AV1]: "AV1 (libsvtav1)",
};

const AUDIO_CODEC_LABELS: Record<AudioCodec, string> = {
  [AudioCodec.Opus]: "Opus (libopus)",
  [AudioCodec.AAC]: "AAC",
  [AudioCodec.FDKAAC]: "AAC (Fraunhofer)",
  [AudioCodec.EAC3]: "E-AC3 (Dolby Digital+)",
  [AudioCodec.MP3]: "MP3 (libmp3lame)",
};

const FRAMERATE_LABELS: Record<FrameRate, string> = {
  [FrameRate.Source]: "Source",
  [FrameRate.NTSC]: "NTSC (29.97)",
  [FrameRate.NTSC_CAPPED]: "NTSC cap (source or 29.97)",
  [FrameRate.NTSC_FILM]: "NTSC Film (23.976)",
  [FrameRate.PAL]: "PAL (25)",
  [FrameRate.FLUID]: "Fluid (60)",
  [FrameRate.MINIMAL]: "Minimal (6)",
};

// ─── Option arrays (Base) ─────────────────────────────────────────────────────

const AUDIO_CODECS = (
  Object.entries(AUDIO_CODEC_LABELS) as Entries<typeof AUDIO_CODEC_LABELS>
).map(([value, label]) => ({ value, label }));

const COLOR_DEPTHS = [
  { value: ColorDepth.BIT_8, label: "8-bit (yuv420p)" },
  { value: ColorDepth.BIT_10, label: "10-bit (yuv420p10le)" },
  { value: ColorDepth.BIT_12, label: "12-bit (yuv420p12le)" },
];

const DECODERS = [
  { value: "", label: "Software (CPU)" },
  { value: Decoder.CUDA, label: "CUDA (NVIDIA)" },
  { value: Decoder.VAAPI, label: "VAAPI (Intel/AMD)" },
] as const;

// ─── Sub-components ──────────────────────────────────────────────────────────

function FieldLabel(props: {
  children: JSX.Element;
  prefix?: string;
  suffix?: string;
  hint?: string | number;
}) {
  return (
    <div class="mb-1 flex justify-between">
      <h3 class="font-semibold text-info text-xs uppercase tracking-widest">
        {props.children}
      </h3>
      <Show when={props.hint}>
        <span class="self-end text-base-content/50 text-xs">
          {props.prefix}
          {props.hint}
          {props.suffix}
        </span>
      </Show>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Page() {
  const [settings, setSettings] = createStore<EncodeSettings>({
    ...socialPresetSettings(SocialPreset.WhatsApp),
  });
  const [advancedSettings, setAdvancedSettings] = createSignal(false);
  const [downloadableKey, setDownloadableKey] = createSignal<string>();
  const [file, setFile] = createSignal<File | null>(null);
  const [canSubmit, setCanSubmit] = createSignal(false);
  const [status, setStatus] = createSignal<ServerResponse>({
    status: Status.CLIENT_IDLE,
    message: "",
  });
  const [encodingHistory, setEncodingHistory] = makePersisted(
    createStore<LocalStorageData>(
      { fileHistory: [] },
      {
        name: "local-storage-data",
      },
    ),
  );

  // Dynamically resolved descriptor objects
  const currentVideoDescriptor = createMemo(
    () => VIDEO_DESCRIPTORS[settings.video.videoCodec],
  );
  const currentAudioDescriptor = createMemo(
    () => AUDIO_DESCRIPTORS[settings.audio.audioCodec],
  );

  // Dynamic Options
  // hardcoded switch on some since some preset range like svtav1 are already an array and some like libx264 are an object
  const availableVideoPresets = createMemo(() => {
    switch (settings.video.videoCodec) {
      case VideoCodec.AV1:
        return AV1.presets;
      default:
        return objectValues(currentVideoDescriptor().presets);
    }
  });

  const availableVideoTunes = createMemo(() => {
    switch (settings.video.videoCodec) {
      case VideoCodec.AV1:
        return AV1.tunes;
      default:
        return objectValues(currentVideoDescriptor().tunes);
    }
  });

  const availableAudioProfiles = createMemo(() => {
    return objectValues(currentAudioDescriptor().profiles);
  });

  const currentVisualQuality = createMemo(() =>
    getVisualQualityForCrf({
      crf: settings.video.crf,
      codec: settings.video.videoCodec,
    }),
  );

  // Validation Signals
  const crfValid = () =>
    settings.video.crf >= currentVideoDescriptor().crfMin &&
    settings.video.crf <= currentVideoDescriptor().crfMax;
  const bitrateValid = () =>
    settings.audio.audioBitrate >= 8 && settings.audio.audioBitrate <= 640;

  createEffect(() => {
    const valid =
      file() !== null &&
      crfValid() &&
      bitrateValid() &&
      status().status === Status.CLIENT_IDLE;
    setCanSubmit(valid);
  });

  function applySocialPreset(preset: SocialPreset) {
    setSettings(socialPresetSettings(preset));
  }

  function updateSettingsWithPresetMatch(
    update: (current: EncodeSettings) => EncodeSettings,
  ) {
    setSettings(markMatchingSocialPreset(update(cloneSettings(settings))));
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setDownloadableKey();
    const f = file();
    if (!canSubmit() || !f) return;

    setStatus({ status: Status.CLIENT_IDLE, message: "" });
    try {
      const outArgs = buildOutArgs(settings);
      const uploadLink = await onRequestUpload({
        filename: f.name,
        type: f.type,
      });

      setStatus({ status: Status.CLIENT_UPLOADING });
      await uploadFileToPresignedUrl(f, uploadLink.presignedUrl);
      setStatus({ status: Status.CLIENT_PROCESSING });
      const result = await onEncodeVideo({
        objectKey: uploadLink.objectKey,
        outputExtension: settings.outputExtension,
        settings: {
          outArgs,
          ...(settings.decoder ? { hwdecode: settings.decoder } : {}),
        },
      });

      switch (result.status) {
        case Status.OK: {
          setStatus({
            status: Status.CLIENT_PROCESSING,
            jobId: result.jobId,
          });
          const backgroundJob = await pollUntilDone(
            async () => {
              const response = await onCheckJobStatus({ jobId: result.jobId });
              switch (response.status) {
                case Status.ERRORED:
                  setStatus({
                    status: response.status,
                    errorVariant: response.errorVariant,
                    message: response.message,
                  });
                  break;
                default:
                  setStatus({
                    status: response.status,
                    message: response.message,
                  });
              }
              return response;
            },
            (r) => r.progress === 100 || r.status === Status.ERRORED,
          );

          if (backgroundJob.status === Status.OK) {
            const url = await onRequestDownload({
              objectKey: result.objectKey,
            });
            setStatus({ status: Status.CLIENT_IDLE });
            setDownloadableKey(url.presignedUrl);
            setEncodingHistory(
              "fileHistory",
              encodingHistory.fileHistory.length,
              {
                filename: f.name,
                type: f.type,
                uploadedAt: Date.now(),
                objectKey: url.presignedUrl,
                expiresAt: url.expiresAt,
              },
            );
          }
          break;
        }
        case Status.ERRORED:
          setStatus({
            status: result.status,
            errorVariant: result.errorVariant,
            message: result.message,
          });
          break;
      }
    } catch (err) {
      setStatus({
        status: Status.ERRORED,
        errorVariant: ErrorVariant.UNKNOWN,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const argsPreview = () => {
    const args = buildOutArgs(settings);
    return Object.entries(args)
      .map(([k, v]) => `-${k} ${v}`)
      .join(" ");
  };

  return (
    <div class="mx-auto max-w-4xl space-y-8 px-4 pt-4 pb-12">
      {/* Header */}
      <div>
        <div class="mb-1 flex items-center gap-3">
          <div class="size-2 animate-pulse rounded-full bg-primary" />
          <span class="text-xs text-zinc-500 uppercase tracking-widest">
            ffmpeg encoder
          </span>
        </div>
        <h1 class="font-semibold text-3xl">Video Encode</h1>
        <p class="mt-1 text-sm text-zinc-500">
          Configure and dispatch an ffmpeg encoding job to the worker queue.
        </p>
      </div>

      <form onsubmit={handleSubmit} class="space-y-5">
        {/* File input */}
        <fieldset class="fieldset bg-base-300 p-4">
          <legend class="fieldset-legend">Input File</legend>
          <input
            type="file"
            name="file"
            id="file"
            class="file-input file-input-primary"
            onchange={(e) => {
              const f = e.currentTarget.files?.item(0) ?? null;
              setFile(f);
              setStatus({ status: Status.CLIENT_IDLE, message: "" });
            }}
          />
        </fieldset>

        {/* Social preset controls */}
        <fieldset class="fieldset bg-base-300 p-4">
          <legend class="fieldset-legend">Export Profile</legend>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <FieldLabel>Preset</FieldLabel>
              <select
                class="select"
                value={settings.socialPreset}
                onchange={(e) => {
                  const preset = e.currentTarget.value as SocialPreset;
                  if (preset === SocialPreset.Custom) {
                    setSettings("socialPreset", SocialPreset.Custom);
                    return;
                  }
                  applySocialPreset(preset);
                }}
              >
                {objectEntries(SOCIAL_PRESET_LABELS).map(([value, label]) => (
                  <option
                    selected={value === settings.socialPreset}
                    value={value}
                  >
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel>Resolution</FieldLabel>
              <select
                name="resolution"
                id="resolution"
                class="select"
                value={settings.video.resolution}
                onchange={(e) => {
                  const resolution = e.currentTarget.value as Resolution;
                  updateSettingsWithPresetMatch((current) => ({
                    ...current,
                    video: { ...current.video, resolution },
                  }));
                }}
              >
                {objectValues(Resolution)
                  .toReversed()
                  .map((resolution) => (
                    <option
                      selected={resolution === settings.video.resolution}
                      value={resolution}
                    >
                      {resolution === Resolution.SOURCE
                        ? "Source"
                        : `${resolution}p`}
                    </option>
                  ))}
              </select>
              <Show when={settings.socialPreset === SocialPreset.WhatsApp}>
                <p class="label text-warning">
                  480p is good enough for everyday sharing.
                </p>
              </Show>
            </div>

            <div>
              <FieldLabel>Visual Quality</FieldLabel>
              <select
                class="select"
                value={currentVisualQuality()}
                onchange={(e) => {
                  const quality = e.currentTarget.value as VisualQuality;
                  updateSettingsWithPresetMatch((current) => ({
                    ...current,
                    video: {
                      ...current.video,
                      crf: getVisualQualityCrf({
                        quality,
                        codec: current.video.videoCodec,
                      }),
                    },
                  }));
                }}
              >
                <For each={VISUAL_QUALITY_OPTIONS}>
                  {(quality) => (
                    <option
                      selected={quality.value === currentVisualQuality()}
                      value={quality.value}
                    >
                      {quality.label}
                    </option>
                  )}
                </For>
                <Show when={currentVisualQuality() === ""}>
                  <option selected value="">
                    Custom
                  </option>
                </Show>
              </select>
            </div>
          </div>
        </fieldset>

        <label class="label cursor-pointer justify-start gap-3 rounded-box bg-base-300 p-4">
          <input
            type="checkbox"
            class="checkbox checkbox-primary"
            checked={advancedSettings()}
            onchange={(e) => setAdvancedSettings(e.currentTarget.checked)}
          />
          <span class="label-text font-semibold">Advanced settings</span>
        </label>

        <Show when={advancedSettings()}>
          {/* Video settings */}
          <fieldset class="fieldset bg-base-300 p-4">
            <legend class="fieldset-legend">Video</legend>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <FieldLabel>Codec</FieldLabel>
                <select
                  class="select"
                  name="codec"
                  value={settings.video.videoCodec}
                  onchange={(e) => {
                    const codec = e.currentTarget.value as VideoCodec;
                    updateSettingsWithPresetMatch((current) => ({
                      ...current,
                      video: {
                        ...current.video,
                        videoCodec: codec,
                        preset:
                          codec === VideoCodec.AV1
                            ? Preset.EIGHT
                            : Preset.Medium,
                        crf: Math.min(
                          current.video.crf,
                          VIDEO_DESCRIPTORS[codec].crfMax,
                        ),
                        tune: "",
                      },
                    }));
                  }}
                >
                  {objectEntries(VIDEO_CODEC_LABELS).map(([key, label]) => (
                    <option
                      selected={key === settings.video.videoCodec}
                      value={key}
                    >
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Preset</FieldLabel>
                <select
                  class="select"
                  disabled={availableVideoPresets().length === 0}
                  value={settings.video.preset}
                  onchange={(e) => {
                    const val = e.currentTarget.value as Preset;
                    updateSettingsWithPresetMatch((current) => ({
                      ...current,
                      video: { ...current.video, preset: val },
                    }));
                  }}
                >
                  <Show
                    when={availableVideoPresets().length > 0}
                    fallback={<option>— no presets available —</option>}
                  >
                    <For each={availableVideoPresets()}>
                      {(preset) => (
                        <option
                          selected={preset === settings.video.preset}
                          value={preset}
                        >
                          {preset}
                        </option>
                      )}
                    </For>
                  </Show>
                </select>
              </div>

              <div>
                <FieldLabel hint="optional">Tune</FieldLabel>
                <select
                  class="select"
                  value={settings.video.tune.toString()}
                  disabled={availableVideoTunes().length === 0}
                  onchange={(e) => {
                    const tune = e.currentTarget.value as Tune;
                    updateSettingsWithPresetMatch((current) => ({
                      ...current,
                      video: { ...current.video, tune },
                    }));
                  }}
                >
                  <option value="">— none —</option>
                  <For each={availableVideoTunes()}>
                    {(Tune) => <option value={Tune}>{Tune}</option>}
                  </For>
                </select>
              </div>

              <div>
                <FieldLabel prefix="value: " hint={settings.video.crf}>
                  CRF{" "}
                  <span class="text-base-content/30">
                    ({currentVideoDescriptor().crfMin}-
                    {currentVideoDescriptor().crfMax})
                  </span>
                </FieldLabel>
                <input
                  type="number"
                  class={cn("input", !crfValid() && "input-error")}
                  min={currentVideoDescriptor().crfMin}
                  max={currentVideoDescriptor().crfMax}
                  value={settings.video.crf}
                  onchange={(e) =>
                    updateSettingsWithPresetMatch((current) => ({
                      ...current,
                      video: {
                        ...current.video,
                        crf: Number(e.currentTarget.value),
                      },
                    }))
                  }
                />
                <input
                  type="range"
                  class="range range-primary mt-2"
                  min={currentVideoDescriptor().crfMin}
                  max={currentVideoDescriptor().crfMax}
                  value={settings.video.crf}
                  oninput={(e) =>
                    updateSettingsWithPresetMatch((current) => ({
                      ...current,
                      video: {
                        ...current.video,
                        crf: Number(e.currentTarget.value),
                      },
                    }))
                  }
                />
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-6">
              <div>
                <FieldLabel>Color Depth</FieldLabel>
                <div class="flex flex-wrap gap-2">
                  <For each={COLOR_DEPTHS}>
                    {(cd) => (
                      <button
                        type="button"
                        onclick={() =>
                          updateSettingsWithPresetMatch((current) => ({
                            ...current,
                            video: { ...current.video, colorDepth: cd.value },
                          }))
                        }
                        aria-pressed={settings.video.colorDepth === cd.value}
                        class={cn(
                          "btn",
                          settings.video.colorDepth === cd.value
                            ? "btn-info"
                            : "",
                        )}
                      >
                        {cd.label}
                      </button>
                    )}
                  </For>
                </div>
              </div>
              <div class="grid max-md:gap-2 md:ml-auto">
                <FieldLabel>Optimize</FieldLabel>
                <input
                  type="checkbox"
                  class="toggle toggle-info md:ml-auto"
                  checked={settings.video.defaultDistributionArgs}
                  onchange={(e) =>
                    updateSettingsWithPresetMatch((current) => ({
                      ...current,
                      video: {
                        ...current.video,
                        defaultDistributionArgs: e.currentTarget.checked,
                      },
                    }))
                  }
                />
              </div>
              <div>
                <FieldLabel>Frame Rate</FieldLabel>
                <select
                  name="framerate"
                  id="framerate"
                  class="select"
                  value={settings.video.framerate}
                  onchange={(e) => {
                    const framerate = e.currentTarget.value as FrameRate;
                    updateSettingsWithPresetMatch((current) => ({
                      ...current,
                      video: { ...current.video, framerate },
                    }));
                  }}
                >
                  {objectValues(FrameRate).map((value) => (
                    <option
                      selected={value === settings.video.framerate}
                      value={value}
                    >
                      {FRAMERATE_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {/* Audio settings */}
          <fieldset class="fieldset bg-base-300 p-4">
            <legend class="fieldset-legend">Audio</legend>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <FieldLabel>Codec</FieldLabel>
                <select
                  class="select"
                  value={settings.audio.audioCodec}
                  onchange={(e) => {
                    const codec = e.currentTarget.value as AudioCodec;
                    updateSettingsWithPresetMatch((current) => ({
                      ...current,
                      audio: { ...current.audio, audioCodec: codec },
                    }));
                  }}
                >
                  {AUDIO_CODECS.map((codec) => (
                    <option
                      selected={codec.value === settings.audio.audioCodec}
                      value={codec.value}
                    >
                      {codec.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel hint="optional">Profile</FieldLabel>
                <select
                  class={cn(
                    "select",
                    availableAudioProfiles().length === 0 && "btn-disabled",
                  )}
                  value={settings.audio.audioProfile}
                  disabled={availableAudioProfiles().length === 0}
                  onchange={(e) => {
                    const profile = e.currentTarget.value as ReturnType<
                      typeof availableAudioProfiles
                    >[number];
                    updateSettingsWithPresetMatch((current) => ({
                      ...current,
                      audio: { ...current.audio, audioProfile: profile },
                    }));
                  }}
                >
                  <option value="">— none —</option>
                  <For each={availableAudioProfiles()}>
                    {(profile) => <option value={profile}>{profile}</option>}
                  </For>
                </select>
              </div>

              <div>
                <FieldLabel hint={settings.audio.audioBitrate} suffix=" kbps">
                  Bitrate
                </FieldLabel>
                <input
                  type="number"
                  class={`input ${bitrateValid() ? "" : "invalid"}`}
                  min={8}
                  max={768}
                  step={8}
                  value={settings.audio.audioBitrate}
                  onchange={(e) =>
                    updateSettingsWithPresetMatch((current) => ({
                      ...current,
                      audio: {
                        ...current.audio,
                        audioBitrate: Number(e.currentTarget.value),
                      },
                    }))
                  }
                />
                <input
                  type="range"
                  class="range range-secondary mt-2"
                  min={8}
                  max={768}
                  step={8}
                  value={settings.audio.audioBitrate}
                  oninput={(e) =>
                    updateSettingsWithPresetMatch((current) => ({
                      ...current,
                      audio: {
                        ...current.audio,
                        audioBitrate: Number(e.currentTarget.value),
                      },
                    }))
                  }
                />
              </div>
            </div>
          </fieldset>

          {/* Hardware & filters */}
          <fieldset class="fieldset bg-base-300 p-4">
            <legend class="fieldset-legend">Hardware & Filters</legend>
            <div class="flex flex-wrap items-end gap-4 *:flex-1">
              <div>
                <FieldLabel>HW Decoder</FieldLabel>
                <select
                  class="select"
                  value={settings.decoder}
                  onchange={(e) => {
                    const val = e.currentTarget
                      .value as EncodeSettings["decoder"];
                    updateSettingsWithPresetMatch((current) => ({
                      ...current,
                      decoder: val,
                    }));
                  }}
                >
                  <For each={DECODERS}>
                    {(d) => <option value={d.value}>{d.label}</option>}
                  </For>
                </select>
              </div>

              <div>
                <FieldLabel hint="optional">Drawtext overlay</FieldLabel>
                <input
                  type="text"
                  class="input"
                  placeholder="e.g. Test encode v2"
                  value={settings.video.filters.drawtext}
                  oninput={(e) =>
                    updateSettingsWithPresetMatch((current) => ({
                      ...current,
                      video: {
                        ...current.video,
                        filters: {
                          ...current.video.filters,
                          drawtext: e.currentTarget.value,
                        },
                      },
                    }))
                  }
                />
              </div>
            </div>
          </fieldset>
        </Show>

        {/* Args preview */}
        <div>
          <div class="mb-2 text-base-content/80 text-xs uppercase tracking-widest">
            Generated args preview
          </div>
          <div class="box-border bg-base-300">
            <p class="break-all p-4">
              <span class="text-secondary">ffmpeg</span>{" "}
              <span class="text-accent">$IN_ARGS</span>{" "}
              <span class="text-base-content/60">{argsPreview()}</span>{" "}
              <span class="text-accent">$OUTPUT</span>
            </p>
          </div>
        </div>

        {/* Submit & status */}
        <div class="flex flex-wrap items-center gap-4">
          <Show when={downloadableKey()}>
            <a
              href={downloadableKey()}
              rel="noopener noreferrer"
              target="_blank"
              class="btn btn-secondary"
            >
              Download
            </a>
          </Show>
          <Show
            when={status().status !== Status.ERRORED}
            fallback={
              <p
                class="max-w-md truncate text-error text-sm"
                title={status().message}
              >
                {status().message}
              </p>
            }
          >
            <button
              type="submit"
              class="btn btn-primary"
              disabled={!canSubmit()}
            >
              <Switch fallback={import.meta.env.DEV && Status[status().status]}>
                <Match when={status().status === Status.CLIENT_IDLE}>
                  Enqueue Job
                  <MoveRight class="size-4" />
                </Match>
                <Match when={status().status === Status.CLIENT_PROCESSING}>
                  Processing…
                </Match>
                <Match when={status().status === Status.CLIENT_UPLOADING}>
                  Uploading…
                </Match>
                <Match when={status().status === Status.ERRORED}>Error</Match>
                <Match when={status().status === Status.OK}>Ready</Match>
              </Switch>
            </button>
          </Show>
        </div>
      </form>

      <ClientOnly>
        <Show when={encodingHistory.fileHistory.length > 0}>
          <div class="space-y-3 rounded-box bg-base-200 p-4">
            <h1 class="text-xl">History</h1>
            <For each={encodingHistory.fileHistory.toReversed()}>
              {(item) => (
                <div class="bg-base-300 p-4">
                  <div class="mb-2 flex flex-wrap items-center gap-2">
                    <h3 class="wrap-anywhere font-semibold">{item.filename}</h3>
                    <p class="text-base-content/50 text-xs">
                      ({new Date(item.uploadedAt).toUTCString()})
                    </p>
                  </div>
                  <div class="flex flex-wrap items-center gap-4">
                    <Show
                      when={item.expiresAt > Date.now()}
                      fallback={
                        <>
                          <button type="button" class="btn btn-disabled">
                            Expired
                          </button>
                          <p class="text-error text-sm">
                            This file has expired.
                          </p>
                        </>
                      }
                    >
                      <a
                        href={item.objectKey}
                        target="_blank"
                        rel="noopener noreferrer"
                        class={cn(
                          "btn btn-sm btn-info",
                          item.expiresAt < Date.now() && "btn-disabled",
                        )}
                      >
                        View
                      </a>
                      <p class="max-w-md truncate text-error text-sm">
                        Expires at {new Date(item.expiresAt).toLocaleString()}
                      </p>
                    </Show>
                  </div>
                </div>
              )}
            </For>
            <button
              type="button"
              class="btn btn-secondary"
              onclick={() => setEncodingHistory("fileHistory", [])}
            >
              Clear History
            </button>
          </div>
        </Show>
      </ClientOnly>
    </div>
  );
}
