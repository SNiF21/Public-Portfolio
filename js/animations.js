function initializeScrollAnimations() {
  const revealElements = document.querySelectorAll(
    "#main > header, #main > section, #main > footer, main, body > .mx-auto > header, body > .mx-auto > section, body > .mx-auto > footer"
  );

  revealElements.forEach((element) => element.classList.add("reveal-on-scroll"));

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  if (!("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  revealElements.forEach((element) => observer.observe(element));
}

initializeScrollAnimations();
