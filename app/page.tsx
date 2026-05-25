"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SECTIONS = [
  {
    symbol: "☍",
    title: "01 · INVESTIGACIÓN",
    label: "Investigación",
  },
  {
    symbol: "⌬",
    title: "02 · ESCUELA",
    label: "Escuela",
  },
  {
    symbol: "⚷",
    title: "03 · SALA DE JUEGOS",
    label: "Sala de Juegos",
  },
  {
    symbol: "⌗",
    title: "04 · BLOG",
    label: "Blog",
  },
  {
    symbol: "☊",
    title: "05 · RADIO",
    label: "Radio",
  },
] as const;

type RadioMode = "ruido-blanco" | "psicoandino" | "nacionales";

const RADIO_SELECTORS: { mode: RadioMode; label: string }[] = [
  { mode: "ruido-blanco", label: "> RUIDO BLANCO (Frecuencia Base)" },
  { mode: "psicoandino", label: "> ESTACIÓN PSICOANDINO (Soberana)" },
  { mode: "nacionales", label: "> EMISORAS NACIONALES (Externa)" },
];

function getRadioDisplayText(isPowerOn: boolean, activeMode: RadioMode): string {
  if (!isPowerOn) return "FREQ: 00.0 MHZ | APAGADO";

  switch (activeMode) {
    case "ruido-blanco":
      return "FREQ: 00.0 MHZ | RUIDO BLANCO";
    case "psicoandino":
      return "FREQ: 99.9 MHZ | PSICOANDINO [FALSO VIVO ACTIVO]";
    case "nacionales":
      return "FREQ: 94.1 MHZ | EMISORAS NACIONALES";
  }
}

function RadioConsole() {
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [activeMode, setActiveMode] = useState<RadioMode>("ruido-blanco");

  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const stopAudio = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // Source may already be stopped.
      }
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const startWhiteNoise = useCallback(async () => {
    stopAudio();

    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      channelData[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = 0.02;

    source.connect(gain);
    gain.connect(ctx.destination);

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    source.start();

    sourceNodeRef.current = source;
    gainNodeRef.current = gain;
  }, [stopAudio]);

  useEffect(() => {
    if (isPowerOn && activeMode === "ruido-blanco") {
      void startWhiteNoise();
    } else {
      stopAudio();
    }
  }, [isPowerOn, activeMode, startWhiteNoise, stopAudio]);

  useEffect(() => () => stopAudio(), [stopAudio]);

  const togglePower = () => {
    if (isPowerOn) {
      stopAudio();
      setIsPowerOn(false);
      return;
    }

    setActiveMode("ruido-blanco");
    setIsPowerOn(true);
  };

  const selectMode = (mode: RadioMode) => {
    if (!isPowerOn) return;
    setActiveMode(mode);
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 px-6 py-8">
      <div className="w-full max-w-sm border border-[#555555] px-4 py-3 text-center">
        <p className="text-xs tracking-wider text-white sm:text-sm">
          {getRadioDisplayText(isPowerOn, activeMode)}
        </p>
      </div>

      <button
        type="button"
        onClick={togglePower}
        className={`flex h-16 w-16 items-center justify-center rounded-full border-2 text-sm tracking-wider transition-colors duration-300 ${
          isPowerOn
            ? "border-white text-white"
            : "border-[#555555] text-[#555555]"
        }`}
        aria-label={isPowerOn ? "Apagar radio" : "Encender radio"}
        aria-pressed={isPowerOn}
      >
        ( O )
      </button>

      <div className="flex w-full max-w-sm flex-col gap-3">
        {RADIO_SELECTORS.map(({ mode, label }) => {
          const isActive = isPowerOn && activeMode === mode;

          return (
            <button
              key={mode}
              type="button"
              onClick={() => selectMode(mode)}
              disabled={!isPowerOn}
              className={`border px-4 py-3 text-left text-xs tracking-wider transition-colors duration-300 sm:text-sm ${
                !isPowerOn
                  ? "cursor-not-allowed border-[#1a1a1a] text-[#333333]"
                  : isActive
                    ? "border-white text-white"
                    : "border-[#555555] text-[#555555] hover:border-[#777777] hover:text-[#777777]"
              }`}
              aria-pressed={isActive}
              aria-disabled={!isPowerOn}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const [activated, setActivated] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const index = Math.round(container.scrollLeft / container.clientWidth);
    setActiveIndex(Math.min(Math.max(index, 0), SECTIONS.length - 1));
  }, []);

  useEffect(() => {
    if (!activated) return;

    const container = scrollRef.current;
    if (!container) return;

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [activated, handleScroll]);

  const scrollToSection = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;

    container.scrollTo({
      left: index * container.clientWidth,
      behavior: "smooth",
    });
    setActiveIndex(index);
  };

  const handleEnter = () => {
    setActivated(true);
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black font-mono">
      {/* ESTADO CERO — AJUSTADO EL TAMAÑO DE TEXTO A text-xl */}
      <div
        className={`fixed inset-0 z-20 flex flex-col items-center justify-center bg-black transition-opacity duration-700 ease-out ${
          activated
            ? "pointer-events-none opacity-0"
            : "cursor-pointer opacity-100"
        }`}
        onClick={handleEnter}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleEnter();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Tocar para ingresar al sistema"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-xl tracking-[0.45em] text-white sm:text-2xl">
            PSICOANDINO
          </h1>
          <p className="text-xs tracking-widest text-[#555555] sm:text-sm">
            Dios · Ciencia · Mente
          </p>
        </div>

        <p
          className="absolute bottom-0 left-0 right-0 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-xs tracking-wider text-[#555555] animate-[breathe_3s_ease-in-out_infinite]"
          aria-hidden="true"
        >
          {">>> [ Tocar para ingresar ]"}
        </p>
      </div>

      <div
        className={`flex h-dvh flex-col overflow-hidden transition-opacity duration-700 ease-out ${
          activated ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden={!activated}
      >
        <header className="sticky top-0 z-10 shrink-0 bg-black pt-[env(safe-area-inset-top)]">
          {/* HEADER PRINCIPAL — AJUSTADO A UN ESTILO DE SUB-CONSOLA COMPACTA */}
          <div
            className={`px-4 pb-2 pt-4 transition-all duration-700 ease-out ${
              activated ? "opacity-100" : "opacity-0"
            }`}
          >
            <h1 className="text-center text-xs tracking-[0.4em] text-white uppercase sm:text-sm">
              PSICOANDINO
            </h1>
          </div>

          {/* NAVEGACIÓN — ICONOS ESCALADOS A text-2xl / sm:text-3xl PARA MÁXIMA SOBERANÍA VISUAL */}
<nav
  className={`grid grid-cols-5 justify-items-center w-full border-b border-[#1a1a1a] px-0 pb-4 transition-all duration-700 delay-150 ease-out ${
    activated
      ? "translate-y-0 opacity-100"
      : "pointer-events-none translate-y-2 opacity-0"
  }`}
  aria-label="Navegación principal"
>
            {SECTIONS.map((section, index) => (
              <button
                key={section.label}
                type="button"
                onClick={() => scrollToSection(index)}
                className={`text-2xl leading-none transition-all duration-300 sm:text-3xl hover:text-white ${
                  activeIndex === index ? "text-white scale-110" : "text-[#555555]"
                }`}
                aria-label={`${section.label}${activeIndex === index ? " (sección actual)" : ""}`}
                aria-current={activeIndex === index ? "true" : undefined}
              >
                {section.symbol}
              </button>
            ))}
          </nav>
        </header>

        <div
          ref={scrollRef}
          className={`flex flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-none transition-opacity duration-700 delay-200 ease-out [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            activated
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          style={{ scrollBehavior: "smooth" }}
        >
          {SECTIONS.map((section, index) => (
            <section
              key={section.label}
              id={`section-${index}`}
              className="flex h-full w-full shrink-0 snap-center snap-always bg-black"
            >
              {index === 4 ? (
                <RadioConsole />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-6 px-6">
                  <p className="text-center text-xs tracking-[0.25em] text-[#555555] sm:text-sm">
                    {section.title}
                  </p>
                  <p className="text-xs tracking-widest text-[#333333]">
                    [ SISTEMA EN CONSTRUCCIÓN ]
                  </p>
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}