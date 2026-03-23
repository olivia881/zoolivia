import { useState, useRef, useCallback } from "react";

const PANELS = ["form", "results", "documents", "history"];
const PANEL_LABELS = {
  form: "Anagrafica e input",
  results: "Risultati",
  documents: "Documenti",
  history: "Storico",
};

export default function SwipeableDashboard({ children }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  const goTo = useCallback((index) => {
    const i = Math.max(0, Math.min(index, PANELS.length - 1));
    setActiveIndex(i);
    const el = containerRef.current;
    if (el) {
      const panelWidth = el.offsetWidth;
      el.scrollTo({ left: i * panelWidth, behavior: "smooth" });
    }
  }, []);

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const panelWidth = el.offsetWidth;
    const index = Math.round(scrollLeft / panelWidth);
    if (index >= 0 && index < PANELS.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  }

  return (
    <div className="swipeable-dashboard">
      <nav className="swipeable-nav" aria-label="Navigazione sezioni">
        <button
          type="button"
          className="swipeable-arrow swipeable-prev"
          onClick={goPrev}
          disabled={activeIndex === 0}
          aria-label="Sezione precedente"
        >
          ‹
        </button>
        <div className="swipeable-dots">
          {PANELS.map((key, i) => (
            <button
              key={key}
              type="button"
              className={`swipeable-dot ${i === activeIndex ? "active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Vai a ${PANEL_LABELS[key]}`}
              aria-current={i === activeIndex ? "true" : undefined}
            >
              <span className="sr-only">{PANEL_LABELS[key]}</span>
            </button>
          ))}
        </div>
        <span className="swipeable-current">{PANEL_LABELS[PANELS[activeIndex]]}</span>
        <button
          type="button"
          className="swipeable-arrow swipeable-next"
          onClick={goNext}
          disabled={activeIndex === PANELS.length - 1}
          aria-label="Sezione successiva"
        >
          ›
        </button>
      </nav>

      <p className="swipeable-hint">Scorri ← → oppure usa le frecce per cambiare sezione</p>

      <div
        ref={containerRef}
        className="swipeable-container"
        onScroll={handleScroll}
      >
        {PANELS.map((key, i) => (
          <div key={key} className="swipeable-panel" data-panel={key}>
            {children[i]}
          </div>
        ))}
      </div>
    </div>
  );
}
