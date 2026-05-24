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
          <h1 className="text-2xl tracking-[0.35em] text-white sm:text-3xl">
            PSICOANDINO
          </h1>
          <p className="text-sm tracking-widest text-[#555555] sm:text-base">
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
          <div
            className={`px-4 pb-3 pt-4 transition-all duration-700 ease-out ${
              activated ? "opacity-100" : "opacity-0"
            }`}
          >
            <h1 className="text-center text-lg tracking-[0.3em] text-white sm:text-xl">
              PSICOANDINO
            </h1>
          </div>

          <nav
            className={`flex justify-center gap-6 border-b border-[#1a1a1a] px-4 pb-3 transition-all duration-700 delay-150 ease-out ${
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
                className={`text-xl leading-none transition-colors duration-300 ${
                  activeIndex === index ? "text-white" : "text-[#555555]"
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
                <div className="h-full w-full bg-black" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-6 px-6">
                  <p className="text-center text-sm tracking-[0.25em] text-[#555555] sm:text-base">
                    {section.title}
                  </p>
                  <p className="text-xs tracking-widest text-[#555555]">
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
