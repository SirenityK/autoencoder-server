import {
  AAC,
  AudioCodec,
  type AudioProfile,
  AV1,
  buildFfmpegFilterArg,
  burnTextFilter,
  ColorDepth,
  type Decoder,
  EAC3,
  FDKAAC,
  FrameRate,
  H264,
  H265,
  MP3,
  Opus,
  type Position,
  Preset,
  Resolution,
  standardVideoFilters,
  type Tune,
  VideoCodec,
} from "./ffmpeg";

export enum SocialPreset {
  WhatsApp = "whatsapp",
  Instagram = "instagram",
  Messenger = "messenger",
  Custom = "custom",
}

export enum VisualQuality {
  VisuallyLossless = "visually-lossless",
  Good = "good",
  NotUsuallyNoticeable = "not-usually-noticeable",
  LowQuality = "low-quality",
  LowQualityMeme = "low-quality-meme",
}

export interface EncodeSettings {
  socialPreset: SocialPreset;
  outputExtension: "mkv" | "mp4" | "webm";
  video: {
    videoCodec: VideoCodec;
    resolution: Resolution;
    preset: Preset;
    tune: Tune | "";
    crf: number;
    framerate: FrameRate;
    colorDepth: ColorDepth;
    defaultDistributionArgs: boolean;
    filters: {
      drawtext: string;
      textPosition: Position;
    };
  };
  audio: {
    audioCodec: AudioCodec;
    audioProfile: AudioProfile | "";
    audioBitrate: number;
  };
  decoder: Decoder | "";
}

export const VIDEO_DESCRIPTORS = {
  [VideoCodec.H264]: H264,
  [VideoCodec.H265]: H265,
  [VideoCodec.AV1]: AV1,
} as const;

export const AUDIO_DESCRIPTORS = {
  [AudioCodec.Opus]: Opus,
  [AudioCodec.FDKAAC]: FDKAAC,
  [AudioCodec.AAC]: AAC,
  [AudioCodec.EAC3]: EAC3,
  [AudioCodec.MP3]: MP3,
} as const;

export const VISUAL_QUALITY_OPTIONS = [
  {
    value: VisualQuality.VisuallyLossless,
    label: "Visually lossless",
    crf: 19,
  },
  { value: VisualQuality.Good, label: "Good", crf: 23 },
  {
    value: VisualQuality.NotUsuallyNoticeable,
    label: "Not usually noticeable",
    crf: 28,
  },
  { value: VisualQuality.LowQuality, label: "Low quality", crf: 35 },
  {
    value: VisualQuality.LowQualityMeme,
    label: "Low quality meme",
    crf: "max",
  },
] as const;

export const SOCIAL_PRESET_LABELS: Record<SocialPreset, string> = {
  [SocialPreset.WhatsApp]: "WhatsApp",
  [SocialPreset.Instagram]: "Instagram",
  [SocialPreset.Messenger]: "Messenger",
  [SocialPreset.Custom]: "Custom",
};

const BASE_SOCIAL_SETTINGS = Object.freeze({
  socialPreset: SocialPreset.WhatsApp,
  outputExtension: "mp4",
  video: {
    videoCodec: VideoCodec.H264,
    resolution: Resolution.SD,
    preset: Preset.Slow,
    tune: "" as const,
    framerate: FrameRate.Source,
    crf: 28,
    colorDepth: ColorDepth.BIT_8,
    defaultDistributionArgs: true,
    filters: {
      drawtext: "",
      textPosition: "topRight" as const,
    },
  },
  audio: {
    audioCodec: AudioCodec.AAC,
    audioProfile: "" as const,
    audioBitrate: Math.round(Opus.transparentBitrateKbpsPerCh * 2),
  },
  decoder: "",
}) satisfies EncodeSettings;

export const SOCIAL_PRESETS = Object.freeze({
  [SocialPreset.WhatsApp]: {
    ...BASE_SOCIAL_SETTINGS,
    socialPreset: SocialPreset.WhatsApp,
    video: {
      ...BASE_SOCIAL_SETTINGS.video,
      resolution: Resolution.SD,
      crf: 28,
      framerate: FrameRate.NTSC_CAPPED,
    },
  },
  [SocialPreset.Instagram]: {
    ...BASE_SOCIAL_SETTINGS,
    socialPreset: SocialPreset.Instagram,
    video: {
      ...BASE_SOCIAL_SETTINGS.video,
      resolution: Resolution.FHD,
      crf: 23,
    },
  },
  [SocialPreset.Messenger]: {
    ...BASE_SOCIAL_SETTINGS,
    socialPreset: SocialPreset.Messenger,
    video: {
      ...BASE_SOCIAL_SETTINGS.video,
      resolution: Resolution.HD,
      crf: 23,
    },
  },
}) satisfies Record<Exclude<SocialPreset, SocialPreset.Custom>, EncodeSettings>;

export function getMaxCrf(codec: VideoCodec): number {
  return VIDEO_DESCRIPTORS[codec].crfMax;
}

export function getVisualQualityCrf({
  quality,
  codec,
}: {
  quality: VisualQuality;
  codec: VideoCodec;
}): number {
  const option = VISUAL_QUALITY_OPTIONS.find((item) => item.value === quality);
  if (!option) return 23;
  return option.crf === "max" ? getMaxCrf(codec) : option.crf;
}

export function getVisualQualityForCrf({
  crf,
  codec,
}: {
  crf: number;
  codec: VideoCodec;
}): VisualQuality | "" {
  const maxCrf = getMaxCrf(codec);
  const option = VISUAL_QUALITY_OPTIONS.find((item) => {
    const optionCrf = item.crf === "max" ? maxCrf : item.crf;
    return optionCrf === crf;
  });
  return option?.value ?? "";
}

export function cloneSettings(settings: EncodeSettings): EncodeSettings {
  return {
    socialPreset: settings.socialPreset,
    outputExtension: settings.outputExtension,
    video: {
      ...settings.video,
      filters: { ...settings.video.filters },
    },
    audio: { ...settings.audio },
    decoder: settings.decoder,
  };
}

export function socialPresetSettings(preset: SocialPreset): EncodeSettings {
  if (preset === SocialPreset.Custom) {
    return {
      ...cloneSettings(SOCIAL_PRESETS[SocialPreset.WhatsApp]),
      socialPreset: SocialPreset.Custom,
    };
  }
  return cloneSettings(SOCIAL_PRESETS[preset]);
}

export function matchSocialPreset(settings: EncodeSettings): SocialPreset {
  const presets = [
    SocialPreset.WhatsApp,
    SocialPreset.Instagram,
    SocialPreset.Messenger,
  ] as const;
  for (const preset of presets) {
    const candidate = SOCIAL_PRESETS[preset];
    if (settingsMatchPreset(settings, candidate)) return preset;
  }
  return SocialPreset.Custom;
}

export function markMatchingSocialPreset(
  settings: EncodeSettings,
): EncodeSettings {
  return {
    ...cloneSettings(settings),
    socialPreset: matchSocialPreset(settings),
  };
}

export function buildOutArgs(settings: EncodeSettings): Record<string, string> {
  const args: Record<string, string> = {
    "c:v": settings.video.videoCodec,
    preset: String(settings.video.preset),
    crf: String(settings.video.crf),
  };

  if (settings.outputExtension === "mp4") {
    args.movflags = "+faststart";
  }

  if (settings.video.tune !== "") {
    args.tune = String(settings.video.tune);
  }

  const vfParts: string[] = [];

  if (settings.video.framerate !== FrameRate.Source) {
    vfParts.push(
      buildFfmpegFilterArg({
        fps: settings.video.framerate,
      }),
    );
  }

  if (settings.video.resolution !== Resolution.SOURCE) {
    vfParts.push(shrinkToResolutionFilter(settings.video.resolution));
  }

  if (settings.video.defaultDistributionArgs) {
    vfParts.push(
      standardVideoFilters({ colorDepth: settings.video.colorDepth }),
    );
  }

  if (settings.video.filters.drawtext.trim()) {
    vfParts.push(
      burnTextFilter({
        text: settings.video.filters.drawtext,
        position: settings.video.filters.textPosition,
        fontSize: 24,
      }),
    );
  }

  if (vfParts.length > 0) args.vf = vfParts.join(",");

  args["c:a"] = settings.audio.audioCodec;
  args["b:a"] = `${settings.audio.audioBitrate}k`;
  if (settings.audio.audioProfile)
    args["profile:a"] = settings.audio.audioProfile;

  return args;
}

function settingsMatchPreset(settings: EncodeSettings, preset: EncodeSettings) {
  return (
    settings.outputExtension === preset.outputExtension &&
    settings.video.videoCodec === preset.video.videoCodec &&
    settings.video.resolution === preset.video.resolution &&
    settings.video.preset === preset.video.preset &&
    settings.video.tune === preset.video.tune &&
    settings.video.crf === preset.video.crf &&
    settings.video.framerate === preset.video.framerate &&
    settings.video.colorDepth === preset.video.colorDepth &&
    settings.video.defaultDistributionArgs ===
      preset.video.defaultDistributionArgs &&
    settings.video.filters.drawtext === preset.video.filters.drawtext &&
    settings.video.filters.textPosition === preset.video.filters.textPosition &&
    settings.audio.audioCodec === preset.audio.audioCodec &&
    settings.audio.audioProfile === preset.audio.audioProfile &&
    settings.audio.audioBitrate === preset.audio.audioBitrate &&
    settings.decoder === preset.decoder
  );
}

function shrinkToResolutionFilter(resolution: Resolution): string {
  return buildFfmpegFilterArg({
    scale: `w=-2:h='min(${resolution}\\,ih)':flags=lanczos`,
  });
}
