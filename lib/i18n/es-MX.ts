import type { dict as enUS } from "./en-US";

export const dict = {
  common: {
    appName: "Optiflow",
    nav: {
      encoder: "Optimizador",
      language: "Idioma",
    },
    locale: {
      enUS: "Ingles (EE. UU.)",
      esMX: "Español (MX)",
    },
  },
  layout: {
    homeAria: "Ir a la pagina principal de Optiflow",
  },
  home: {
    hero: {
      badge: "Los presets sociales ya estan activos",
      title:
        "Convierte videos pesados en archivos limpios y fáciles de compartir.",
      copy: "Optiflow le da a creadores y equipos una superficie enfocada para codificar: elige un preset de destino, ajusta la calidad cuando haga falta y exporta sin pelearte con rituales de linea de comandos.",
      openEncoder: "Abrir optimizador",
      seePresets: "Ver presets",
      stats: {
        presetsTitle: "Presets",
        presetsDesc: "WhatsApp, Instagram, Messenger",
        controlsTitle: "Controles",
        controlsValue: "Precisos",
        controlsDesc: "calidad, tamaño, velocidad",
      },
      livePreset: "preset activo",
      exportLabel: "exportacion para {{ preset }}",
      readyLine: "La exportacion para {{ preset }} casi esta lista",
      alert:
        "Los presets fijan la base; los controles avanzados siguen disponibles.",
    },
    presets: {
      badge: "Biblioteca de presets",
      title: "Elige el destino y deja que Optiflow moldee la exportacion.",
      copy: "El optimizador ahora incluye presets sociales reales que seleccionan valores sensatos de resolucion, calidad, FPS, audio y contenedor antes de tocar ajustes avanzados.",
      usePreset: "Usar preset",
      details: {
        whatsapp:
          "Para compartir en el dia a dia con FPS limitado y archivos mas pequenos.",
        instagram:
          "Exportaciones Full HD para redes, pensadas para reels y publicaciones mas limpias.",
        messenger:
          "Clips HD equilibrados para chats, vistas previas y entregas rapidas.",
      },
    },
    codecs: {
      badge: "Codecs destacados",
      title: "Elige el motor correcto para el archivo que necesitas.",
      cta: "Probar un codec",
      cards: {
        h264: {
          label: "Universal",
          description:
            "Reproduccion confiable para entregas diarias, revisiones rapidas y amplia compatibilidad.",
          badge: "opcion segura",
        },
        h265: {
          label: "Compacto",
          description:
            "Archivos mas nitidos y pequenos cuando la calidad y el almacenamiento importan.",
          badge: "eficiente",
        },
        av1: {
          label: "Moderno",
          description:
            "Una opcion a futuro para alta compresion y distribucion web limpia.",
          badge: "nueva gen.",
        },
        audio: {
          label: "Audio",
          description:
            "Rutas de audio ajustadas para voz, musica y exportaciones compactas para redes.",
          badge: "balanceado",
        },
      },
    },
    preview: {
      badge: "Vista previa de ajustes",
      title: "Técnico cuando quieres. Amable cuando no.",
      copy: "La tira de presets explica qué cambia sin obligar a todos a leer banderas de ffmpeg. El comando sigue ahí para quien quiera ver la salida exacta.",
      generatedArgs: "vista previa de argumentos",
      presetLabel: "preset {{ preset }}",
      rotating: "ciclando presets",
      audioKbps: "{{ bitrate }} kbps audio",
    },
  },
  encode: {
    header: {
      eyebrow: "optimizador ffmpeg",
      title: "Codificar video",
      copy: "Configura y envia un trabajo de ffmpeg a la cola del worker.",
    },
    sections: {
      inputFile: "Archivo de entrada",
      sourceMetadata: {
        title: "Metadatos de origen",
        duration: "Duracion",
        resolution: "Resolucion",
        frameRate: "Fotogramas por segundo",
        fileSize: "Tamaño de archivo",
        container: "Contenedor",
        videoStreams: "Pistas de video",
        audioStreams: "Pistas de audio",
        subtitleStreams: "Pistas de subtitulos",
        codec: "Codec",
        channels: "Canales",
        sampleRate: "Frecuencia de muestreo",
        streamCount: "{{count}} pista(s)",
      },
      exportProfile: "Perfil de exportacion",
      video: "Video",
      audio: "Audio",
      hardwareFilters: "Hardware y filtros",
      outputEstimate: {
        title: "Estimacion de salida",
        targetVideoCodec: "Codec de video objetivo",
        targetAudioCodec: "Codec de audio objetivo",
        targetResolution: "Resolucion objetivo",
        targetFrameRate: "Fotogramas objetivo",
        audioBitrate: "Bitrate de audio",
        estimatedSize: "Tamaño estimado",
        outputContainer: "Contenedor de salida",
        source: "Original",
        sourceFps: "FPS original",
        unavailable: "No disponible — bitrate de video desconocido",
      },
    },
    fields: {
      preset: "Preset",
      resolution: "Resolucion",
      visualQuality: "Calidad visual",
      advancedSettings: "Ajustes avanzados",
      codec: "Codec",
      tune: "Ajuste fino",
      colorDepth: "Profundidad de color",
      optimize: "Optimizar",
      frameRate: "Fotogramas por segundo",
      profile: "Perfil",
      bitrate: "Bitrate",
      hwDecoder: "Decodificador HW",
      drawtextOverlay: "Texto superpuesto",
      generatedArgsPreview: "Vista previa de argumentos",
    },
    hints: {
      optional: "opcional",
      value: "valor: ",
      whatsappResolution: "480p es suficiente por el tamaño de los móviles.",
      noPresetsAvailable: "- no hay presets disponibles -",
      none: "- ninguno -",
      drawtextPlaceholder: "p. ej. Prueba encode v2",
    },
    presets: {
      whatsapp: "WhatsApp",
      instagram: "Instagram",
      messenger: "Messenger",
      custom: "Personalizado",
    },
    options: {
      source: "Original",
      visualQuality: {
        visuallyLossless: "Visualmente sin perdida",
        good: "Buena",
        notUsuallyNoticeable: "Normalmente imperceptible",
        lowQuality: "Baja calidad",
        lowQualityMeme: "Baja calidad meme",
        custom: "Personalizada",
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
        source: "Original",
        ntsc: "NTSC (29.97)",
        ntscCapped: "limite NTSC (original o 29.97)",
        ntscFilm: "NTSC Cine (23.976)",
        pal: "PAL (25)",
        fluid: "Fluido (60)",
        minimal: "Minimo (6)",
      },
    },
    actions: {
      download: "Descargar",
      enqueueJob: "Encolar trabajo",
      processing: "Procesando...",
      uploading: "Subiendo...",
      error: "Error",
      ready: "Listo",
      view: "Ver",
      expired: "Expirado",
      clearHistory: "Limpiar historial",
    },
    history: {
      title: "Historial",
      expiredMessage: "Este archivo expiro.",
      expiresAt: "Expira el {{ date }}",
    },
    errors: {
      unknown: "Error desconocido",
    },
  },
  errorPage: {
    internalTitle: "Error interno",
    internalCopy: "Algo salio mal.",
    notFoundTitle: "Pagina no encontrada",
    notFoundCopy: "No se pudo encontrar esta pagina.",
  },
} satisfies typeof enUS;
