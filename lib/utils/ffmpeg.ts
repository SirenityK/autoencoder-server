import type { IntClosedRange, LiteralUnion, ReadonlyDeep } from "type-fest";
import * as v from "valibot";

export enum VideoCodec {
  H264 = "libx264",
  H265 = "libx265",
  AV1 = "libsvtav1",
}

export enum AudioCodec {
  Opus = "libopus",
  FDKAAC = "libfdk_aac",
  AAC = "aac",
  EAC3 = "eac3",
  MP3 = "mp3",
}

export enum Profile {
  BASELINE = "baseline",
  MAIN = "main",
  HIGH = "high",
  HIGH10 = "high10",
}

export enum AudioProfile {
  AAC_LOW = "aac_low",
  AAC_HE = "aac_he",
  AAC_HE_V2 = "aac_he_v2",
}

export enum SubtitleCodec {
  ASS = "ass",
  SSA = "ssa",
  SRT = "srt",
  MOV = "mov_text",
}

export enum Preset {
  Ultrafast = "ultrafast",
  Superfast = "superfast",
  Veryfast = "veryfast",
  Faster = "faster",
  Fast = "fast",
  Medium = "medium",
  Slow = "slow",
  Slower = "slower",
  Veryslow = "veryslow",
  Placebo = "placebo",

  // specific to svt-av1
  ZERO = 0,
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
  SIX = 6,
  SEVEN = 7,
  EIGHT = 8,
  NINE = 9,
  TEN = 10,
  ELEVEN = 11,
  TWELVE = 12,
  THIRTEEN = 13,
}

export enum Tune {
  Animation = "animation",
  Grain = "grain",
  Film = "film",
  PSNR = "psnr",
  SSIM = "ssim",
  ZEROLATENCY = "zerolatency",
  FASTDECODE = "fastdecode",

  // svt-av1 specific
  ZERO = 0,
  ONE = 1,
  TWO = 2,
}

export enum FrameRate {
  Source = "source_fps",
  NTSC = "ntsc",
  NTSC_FILM = "ntsc_film",
  PAL = "pal",
  FLUID = "60",
  MINIMAL = "6",
}

export enum Resolution {
  UHD2 = "7680",
  UHD = "2160",
  QHD = "1440",
  FHD = "1080",
  HD = "720",
  SD = "480",
  LOW = "360",
  VGA = "240",
  POTATO = "144",
  SOURCE = "source",
}

export enum ColorDepth {
  BIT_8 = "yuv420p",
  BIT_10 = "yuv420p10le",
  BIT_12 = "yuv420p12le",
}

export enum Decoder {
  CUDA = "cuda",
  VAAPI = "vaapi",
}

interface _VideoCodecDescriptor {
  codec: VideoCodec;
  presets:
    | Partial<Record<Lowercase<keyof typeof Preset>, Preset>>
    | IntClosedRange<0, 13>[]; // svt-av1;
  tunes:
    | Partial<Record<Lowercase<keyof typeof Tune>, Tune>>
    | IntClosedRange<0, 2>[];
  profiles: Partial<Record<Lowercase<keyof typeof Profile>, Profile>>;
  crfMin: number;
  crfMax: number;
}

interface _AudioCodecDescriptor {
  codec: AudioCodec;
  profiles: Partial<Record<Lowercase<keyof typeof AudioProfile>, AudioProfile>>;
  transparentBitrateKbpsPerCh: number;
}

export type VideoCodecDescriptor = ReadonlyDeep<_VideoCodecDescriptor>;
export type AudioCodecDescriptor = ReadonlyDeep<_AudioCodecDescriptor>;

export const H264 = Object.freeze({
  codec: VideoCodec.H264,
  presets: {
    ultrafast: Preset.Ultrafast,
    superfast: Preset.Superfast,
    veryfast: Preset.Veryfast,
    faster: Preset.Faster,
    fast: Preset.Fast,
    medium: Preset.Medium,
    slow: Preset.Slow,
    slower: Preset.Slower,
    veryslow: Preset.Veryslow,
    placebo: Preset.Placebo,
  },
  tunes: {
    animation: Tune.Animation,
    grain: Tune.Grain,
    film: Tune.Film,
    psnr: Tune.PSNR,
    ssim: Tune.SSIM,
    zerolatency: Tune.ZEROLATENCY,
    fastdecode: Tune.FASTDECODE,
  },
  profiles: {
    baseline: Profile.BASELINE,
    main: Profile.MAIN,
    high: Profile.HIGH,
    high10: Profile.HIGH10,
  },
  crfMin: 0,
  crfMax: 51,
}) satisfies VideoCodecDescriptor;

export const H265 = Object.freeze({
  codec: VideoCodec.H265,
  presets: {
    ultrafast: Preset.Ultrafast,
    superfast: Preset.Superfast,
    veryfast: Preset.Veryfast,
    faster: Preset.Faster,
    fast: Preset.Fast,
    medium: Preset.Medium,
    slow: Preset.Slow,
    slower: Preset.Slower,
    veryslow: Preset.Veryslow,
    placebo: Preset.Placebo,
  },
  tunes: H264.tunes, // H.265 shares the same tune names as H.264 in x265
  profiles: {
    baseline: Profile.BASELINE,
    main: Profile.MAIN,
    high: Profile.HIGH,
    high10: Profile.HIGH10,
  },
  crfMin: 0,
  crfMax: 51,
}) satisfies VideoCodecDescriptor;

export const AV1 = Object.freeze({
  codec: VideoCodec.AV1,
  presets: Array.from({ length: 14 }, (_, i) => i) as IntClosedRange<0, 13>[],
  tunes: [0, 1, 2] as IntClosedRange<0, 2>[],
  profiles: {},
  crfMin: 0,
  crfMax: 63,
}) satisfies VideoCodecDescriptor;

export const Opus = Object.freeze({
  codec: AudioCodec.Opus,
  profiles: {},
  transparentBitrateKbpsPerCh: 64,
}) satisfies AudioCodecDescriptor;

export const FDKAAC = Object.freeze({
  codec: AudioCodec.FDKAAC,
  profiles: {
    aac_low: AudioProfile.AAC_LOW,
    aac_he: AudioProfile.AAC_HE,
    aac_he_v2: AudioProfile.AAC_HE_V2,
  },
  transparentBitrateKbpsPerCh: 64,
}) satisfies AudioCodecDescriptor;

export const AAC = Object.freeze({
  codec: AudioCodec.AAC,
  profiles: {
    aac_low: AudioProfile.AAC_LOW,
  },
  transparentBitrateKbpsPerCh: 64,
}) satisfies AudioCodecDescriptor;

export const EAC3 = Object.freeze({
  codec: AudioCodec.EAC3,
  profiles: {},
  transparentBitrateKbpsPerCh: 448 / 6, // ~74.7 kbps per channel (common for EAC3 with 5.1 channels)
}) satisfies AudioCodecDescriptor;

export const MP3 = Object.freeze({
  codec: AudioCodec.MP3,
  profiles: {},
  transparentBitrateKbpsPerCh: 128 / 2, // ~64 kbps per channel (common for MP3)
}) satisfies AudioCodecDescriptor;

export type Position = "topRight" | "topLeft" | "bottomRight" | "bottomLeft";

export const VideoCodecSchema = v.enum(VideoCodec);
export const AudioCodecSchema = v.enum(AudioCodec);
export const AudioProfileSchema = v.enum(AudioProfile);
export const PresetSchema = v.enum(Preset);

export const SubtitleCodecSchema = v.enum(SubtitleCodec);

export const DecoderSchema = v.enum(Decoder);

export const VideoInfoSchema = v.object({
  format: VideoCodecSchema,
  width: v.pipe(v.number(), v.integer()),
  height: v.pipe(v.number(), v.integer()),
  bit_rate: v.pipe(v.number(), v.integer()),
  frame_rate: v.number(),
  color_space: v.picklist(["YUV", "RGB"]),
  color_range: v.optional(v.nullable(v.picklist(["Limited", "Full"]))),
});

export const AudioInfoSchema = v.object({
  format: AudioCodecSchema,
  channel_s: v.pipe(v.number(), v.integer()),
  bit_rate: v.pipe(v.number(), v.integer()),
  sampling_rate: v.pipe(v.number(), v.integer()),
  language: v.optional(v.nullable(v.string())),
});

export const SubtitleInfoSchema = v.object({
  format: SubtitleCodecSchema,
  title: v.optional(v.nullable(v.string())),
  language: v.optional(v.nullable(v.string())),
  default: v.boolean(), // We can map alias on the ingestion level if needed
});

export const ContainerInfoSchema = v.object({
  file_extension: v.picklist(["mkv", "mp4", "webm"]),
  file_size: v.pipe(v.number(), v.integer()),
  duration: v.pipe(v.number(), v.integer()),
});

export const MediaInfoSchema = v.object({
  container: ContainerInfoSchema,
  video_tracks: v.optional(v.array(VideoInfoSchema), []),
  audio_tracks: v.optional(v.array(AudioInfoSchema), []),
  subtitle_tracks: v.optional(v.array(SubtitleInfoSchema), []),
});

// Automatically extract TS types from the schemas (100% DRY)
export type VCodecType = v.InferOutput<typeof VideoCodecSchema>;
export type ACodecType = v.InferOutput<typeof AudioCodecSchema>;
export type VideoInfo = v.InferOutput<typeof VideoInfoSchema>;
export type AudioInfo = v.InferOutput<typeof AudioInfoSchema>;
export type SubtitleInfo = v.InferOutput<typeof SubtitleInfoSchema>;
export type ContainerInfo = v.InferOutput<typeof ContainerInfoSchema>;
export type MediaInfo = v.InferOutput<typeof MediaInfoSchema>;

export interface EncodeOptions {
  inputs: string[];
  output: string;
  inArgs?: Record<string, string>[];
  outArgs?: Record<string, string>;
  globalArgs?: string[];
  cmd?: string;
  check?: boolean;
  hwdecode?: Decoder;
}

export function buildFfmpegArgs(args: Record<string, string>): string[] {
  const ffmpegArgs: string[] = [];
  for (const [key, value] of Object.entries(args)) {
    ffmpegArgs.push(`-${key}`, value);
  }
  return ffmpegArgs;
}

/**
 * Builds a filtergraph string from a structured filter definition object.
 *
 * The input is a record where keys are filter names and values are either:
 *   - A string (for filters with a single parameter, e.g., "format=yuv420p")
 *   - An object mapping parameter names to values (for filters with multiple parameters, e.g., "scale=w=1280:h=720:flags=lanczos")
 *
 * The output is a properly formatted filtergraph string that can be passed to ffmpeg's `-vf` or `filter_complex` options.
 *
 * Example usage:
 *   buildFfmpegFilterArg({
 *     scale: { w: 1280, h: 720, flags: "lanczos" },
 *     format: "yuv420p",
 *   });
 *   // Returns: "scale=w=1280:h=720:flags=lanczos,format=yuv420p"
 *
 * This utility helps maintain type safety and readability when constructing complex filtergraphs programmatically, while ensuring correct syntax for ffmpeg.
 */
export function buildFfmpegFilterArg(
  filters: Record<string, Record<string, string> | string>,
): string {
  const filterParts: string[] = [];
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === "object" && value !== null) {
      const params = Object.entries(value)
        .map(([k, v]) => `${k}=${v}`)
        .join(":");
      filterParts.push(`${key}=${params}`);
    } else {
      filterParts.push(`${key}=${value}`);
    }
  }
  return filterParts.join(",");
}

/**
 * Standard video filters to ensure consistent color space and range for better compatibility across devices and platforms.
 *
 * - `out_transfer=bt709`: Use BT.709 transfer characteristics (gamma curve) for better color reproduction on HD content.
 * - `out_primaries=bt709`: Use BT.709 color primaries for accurate color representation.
 * - `out_color_matrix=bt709`: Use BT.709 color matrix for correct YUV to RGB conversion.
 * - `out_range=tv`: Use TV range (limited range) for better compatibility with most displays and streaming platforms.
 * - `format=colorDepth`: Set the output pixel format based on the specified color depth (e.g., yuv420p for 8-bit, yuv420p10le for 10-bit).
 *
 * Returns a filtergraph string suitable for `-vf` or `filter_complex`.
 */
export function standardVideoFilters({
  colorDepth = ColorDepth.BIT_8,
}: {
  colorDepth: ColorDepth;
}): string {
  return buildFfmpegFilterArg({
    scale: {
      out_transfer: "bt709",
      out_primaries: "bt709",
      out_color_matrix: "bt709",
      out_range: "tv",
    },
    format: colorDepth,
  });
}

/**
 * Burn text onto the video using the drawtext filter, with a semi-transparent box for readability.
 *
 * @param text      - The text to burn in
 * @param position  - Where to place the text (top-right, top-left, bottom-right, bottom-left)
 * @param fontSize  - Font size in points (default: 24)
 * @param fontColor - Font color (default: white; options: white, black, red, green, blue, yellow)
 *
 * Returns a filtergraph string suitable for `-vf` or `filter_complex`.
 */
export function burnTextFilter({
  text,
  position,
  fontSize = 24,
  fontColor = "white",
}: {
  text: string;
  position: Position;
  fontSize: number;
  fontColor?: LiteralUnion<
    "white" | "black" | "red" | "green" | "blue" | "yellow",
    string
  >;
}): string {
  const margin = 10;
  const positionMap: Record<Position, { x: string; y: string }> = {
    topRight: { x: `w-tw-${margin}`, y: `${margin}` },
    topLeft: { x: `${margin}`, y: `${margin}` },
    bottomRight: { x: `w-tw-${margin}`, y: `h-th-${margin}` },
    bottomLeft: { x: `${margin}`, y: `h-th-${margin}-${margin}` },
  };
  return buildFfmpegFilterArg({
    drawtext: {
      text: `'${text}'`,
      fontsize: fontSize.toString(),
      fontcolor: fontColor,
      box: "1",
      boxcolor: "black@0.5",
      boxborderw: "5",
      ...positionMap[position],
    },
  });
}

/**
 * Scale to a target width (or height), preserving aspect ratio, with
 * Lanczos resampling and mod-2 dimension rounding required by most codecs.
 *
 * Pass only `width` or only `height` — the other axis is computed automatically.
 * Pass both to force an exact resolution (no aspect-ratio preservation).
 *
 * @param width  - Target width  in pixels (-2 = auto-compute, mod-2 aligned)
 * @param height - Target height in pixels (-2 = auto-compute, mod-2 aligned)
 * @param flags  - Scaling algorithm (default "lanczos")
 */
export function scaleFilter({
  width = -2,
  height = -2,
  flags = "bicubic",
}: {
  width?: Resolution | number;
  height?: Resolution | number;
  flags?: string;
}): string {
  if (width === Resolution.SOURCE && height === Resolution.SOURCE) {
    return "";
  }
  if (width === -2 && height === -2)
    throw new Error("scaleFilter: at least one of width or height must be set");
  return buildFfmpegFilterArg({
    scale: `w=${width}:h=${height}:flags=${flags}`,
  });
}

export type DownmixMode = "stereo_from_51" | "mono_from_stereo";
export type UpmixMode = "51_from_stereo";
export type ChannelMapMode = DownmixMode | UpmixMode;

// Audio filters
/**
 * Channel layout conversion using the pan filter.
 *
 * Covers the two most common production needs:
 *   - `stereo_from_51`: Dolby-compatible 5.1 → stereo fold-down
 *   - `mono_from_stereo`: L+R mix to mono (for audio-description tracks, etc.)
 *   - `51_from_stereo`:   Stereo → 5.1 upmix (center + LFE filled; surrounds silent)
 *
 * Returns an audio filtergraph string suitable for `-af` or `filter_complex`.
 */
export function audioChannelMapFilter({
  mode,
}: {
  mode: ChannelMapMode;
}): string {
  const presets: Record<ChannelMapMode, string> = {
    // Dolby standard fold-down coefficients
    stereo_from_51:
      "pan=stereo" + "|FL=FL+0.707*FC+0.707*BL" + "|FR=FR+0.707*FC+0.707*BR",

    mono_from_stereo: "pan=mono|FC=0.5*FL+0.5*FR",

    // Upmix: LFE silent, surrounds silent — avoids audible phase issues
    "51_from_stereo":
      "pan=5.1" +
      "|FL=FL|FR=FR" +
      "|FC=0.5*FL+0.5*FR" +
      "|LFE=0" +
      "|BL=0|BR=0",
  };
  return presets[mode];
}
