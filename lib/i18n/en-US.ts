export const dict = {
  common: {
    appName: "Optiflow",
    nav: {
      encoder: "Encoder",
      language: "Language",
    },
    locale: {
      enUS: "English (US)",
      esMX: "Spanish (MX)",
    },
  },
  layout: {
    homeAria: "Go to the Optiflow home page",
  },
  home: {
    hero: {
      badge: "Social presets are live",
      title: "Turn heavy videos into clean, shareable files.",
      copy: "Optiflow gives creators and teams a focused encoding surface: pick a destination preset, adjust quality when needed, and export without wrestling with command-line rituals.",
      openEncoder: "Open encoder",
      seePresets: "See presets",
      stats: {
        presetsTitle: "Presets",
        presetsDesc: "WhatsApp, Instagram, Messenger",
        controlsTitle: "Controls",
        controlsValue: "Precise",
        controlsDesc: "quality, size, speed",
      },
      livePreset: "live preset",
      exportLabel: "{{ preset }} export",
      readyLine: "{{ preset }} export is almost ready",
      alert: "Presets set the baseline; advanced controls stay available.",
    },
    presets: {
      badge: "Preset library",
      title: "Pick the destination, then let Optiflow shape the export.",
      copy: "The encoder now includes real social presets that select sensible resolution, quality, frame-rate, audio, and container defaults before you touch advanced settings.",
      usePreset: "Use preset",
      details: {
        whatsapp:
          "Compact everyday sharing with capped frame rate and smaller files.",
        instagram:
          "Full HD social exports tuned for cleaner reels and feed posts.",
        messenger:
          "Balanced HD clips for chat threads, previews, and quick handoffs.",
      },
    },
    codecs: {
      badge: "Featured codecs",
      title: "Choose the right engine for the file you need.",
      cta: "Try a codec",
      cards: {
        h264: {
          label: "Universal",
          description:
            "Reliable playback for everyday delivery, fast reviews, and broad compatibility.",
          badge: "safe pick",
        },
        h265: {
          label: "Compact",
          description:
            "Sharper files at smaller sizes when quality and storage both matter.",
          badge: "efficient",
        },
        av1: {
          label: "Modern",
          description:
            "A forward-looking option for high compression and clean web distribution.",
          badge: "next-gen",
        },
        audio: {
          label: "Audio",
          description:
            "Tuned audio paths for voice, music, and compact social-ready exports.",
          badge: "balanced",
        },
      },
    },
    preview: {
      badge: "Live settings preview",
      title: "Technical when you want it. Friendly when you do not.",
      copy: "The preset strip explains what is changing without forcing everyone to read ffmpeg flags. The command remains there for people who want the exact output.",
      generatedArgs: "generated args preview",
      presetLabel: "{{ preset }} preset",
      rotating: "rotating presets",
      audioKbps: "{{ bitrate }} kbps audio",
    },
  },
  encode: {
    header: {
      eyebrow: "ffmpeg encoder",
      title: "Video Encode",
      copy: "Configure and dispatch an ffmpeg encoding job to the worker queue.",
    },
    sections: {
      inputFile: "Input File",
      exportProfile: "Export Profile",
      video: "Video",
      audio: "Audio",
      hardwareFilters: "Hardware & Filters",
    },
    fields: {
      preset: "Preset",
      resolution: "Resolution",
      visualQuality: "Visual Quality",
      advancedSettings: "Advanced settings",
      codec: "Codec",
      tune: "Tune",
      colorDepth: "Color Depth",
      optimize: "Optimize",
      frameRate: "Frame Rate",
      profile: "Profile",
      bitrate: "Bitrate",
      hwDecoder: "HW Decoder",
      drawtextOverlay: "Drawtext overlay",
      generatedArgsPreview: "Generated args preview",
    },
    hints: {
      optional: "optional",
      value: "value: ",
      whatsappResolution: "480p is good enough for everyday sharing on mobile screens.",
      noPresetsAvailable: "- no presets available -",
      none: "- none -",
      drawtextPlaceholder: "e.g. Test encode v2",
    },
    presets: {
      whatsapp: "WhatsApp",
      instagram: "Instagram",
      messenger: "Messenger",
      custom: "Custom",
    },
    options: {
      source: "Source",
      visualQuality: {
        visuallyLossless: "Visually lossless",
        good: "Good",
        notUsuallyNoticeable: "Not usually noticeable",
        lowQuality: "Low quality",
        lowQualityMeme: "Low quality meme",
        custom: "Custom",
      },
      videoCodec: {
        h264: "H.264 (libx264)",
        h265: "H.265 (libx265)",
        av1: "AV1 (libsvtav1)",
      },
      audioCodec: {
        opus: "Opus (libopus)",
        aac: "AAC",
        fdkaac: "AAC (Fraunhofer)",
        eac3: "E-AC3 (Dolby Digital+)",
        mp3: "MP3 (libmp3lame)",
      },
      decoder: {
        software: "Software (CPU)",
        cuda: "CUDA (NVIDIA)",
        vaapi: "VAAPI (Intel/AMD)",
      },
      frameRate: {
        source: "Source",
        ntsc: "NTSC (29.97)",
        ntscCapped: "NTSC cap (source or 29.97)",
        ntscFilm: "NTSC Film (23.976)",
        pal: "PAL (25)",
        fluid: "Fluid (60)",
        minimal: "Minimal (6)",
      },
    },
    actions: {
      download: "Download",
      enqueueJob: "Enqueue Job",
      processing: "Processing...",
      uploading: "Uploading...",
      error: "Error",
      ready: "Ready",
      view: "View",
      expired: "Expired",
      clearHistory: "Clear History",
    },
    history: {
      title: "History",
      expiredMessage: "This file has expired.",
      expiresAt: "Expires at {{ date }}",
    },
    errors: {
      unknown: "Unknown error",
    },
  },
  errorPage: {
    internalTitle: "Internal Error",
    internalCopy: "Something went wrong.",
    notFoundTitle: "Page Not Found",
    notFoundCopy: "This page could not be found.",
  },
};
