import { useEffect } from "react";

/**
 * Active automatiquement les animations "reveal" au scroll
 * pour tout élément ayant la classe `.reveal`.
 * Ajoute `.is-visible` quand l'élément entre dans le viewport.
 */
export function useRevealOnScroll() {
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    const elements = document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)");
    elements.forEach((el) => observer.observe(el));

    // Re-scan périodiquement pour les éléments ajoutés dynamiquement (route changes)
    const rescan = () => {
      document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)").forEach((el) => {
        observer.observe(el);
      });
    };
    const interval = window.setInterval(rescan, 800);

    return () => {
      window.clearInterval(interval);
      observer.disconnect();
    };
  }, []);
}
