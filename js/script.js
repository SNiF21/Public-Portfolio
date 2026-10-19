/* Consolidated site JS. Includes portfolio loader (from scripts/portfolio.js) */
const menuToggle = document.querySelector(".menu-toggle");
const siteHeader = document.querySelector(".site-header");
const siteNavigation = document.querySelector(".site-navigation");

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

function setMenuState(isOpen) {
  if (!menuToggle || !siteHeader || !siteNavigation) return;

  siteHeader.classList.toggle("menu-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
}

if (menuToggle && siteNavigation) {
  menuToggle.addEventListener("click", () => {
    setMenuState(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  siteNavigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenuState(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuState(false);
      menuToggle.focus();
    }
  });
}

initializeScrollAnimations();

const DEFAULT_USER = "SNiF21";

const container = document.getElementById("portfolio-container");
const searchInput = document.getElementById("portfolio-search");
const statusArea = document.getElementById("portfolio-status");
const loadMoreButton = document.getElementById("portfolio-load-more");

const PAGE_SIZE = 6;

const state = {
  projects: [],
  query: "",
  visibleCount: PAGE_SIZE,
};

const STATUS_STYLES = {
  loading: "flex items-center gap-2 text-sm text-stone-300",
  error: "text-sm text-stone-300",
  empty: "text-sm text-stone-300",
  none: "text-sm text-stone-300",
};

function createCard(project) {
  const card = document.createElement("article");
  card.className = "rounded-lg border border-stone-700 bg-stone-800 p-4";

  const title = document.createElement("h3");
  title.className = "text-base font-medium text-stone-100";
  title.textContent = project.name || "Untitled project";

  const description = document.createElement("p");
  description.className = "mt-2 text-sm text-stone-300";
  description.textContent = project.description || "No description available";

  const meta = document.createElement("div");
  meta.className = "mt-3 space-y-1 text-xs text-stone-400";

  const language = document.createElement("span");
  language.style.display = "block";
  language.textContent = project.language ? `Language: ${project.language}` : "Language: N/A";

  const stars = document.createElement("span");
  stars.style.display = "block";
  stars.textContent = `Stars: ${project.stargazers_count ?? 0}`;

  const link = document.createElement("a");
  link.className = "text-xs font-semibold text-stone-200 underline hover:text-stone-50";
  link.style.display = "block";
  link.href = project.html_url || "#";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "View repo";

  meta.appendChild(language);
  meta.appendChild(stars);
  meta.appendChild(link);

  card.appendChild(title);
  card.appendChild(description);
  card.appendChild(meta);

  return card;
}

function setStatus(type, message) {
  if (!statusArea) {
    return;
  }

  statusArea.className = STATUS_STYLES[type] || STATUS_STYLES.none;
  statusArea.innerHTML = "";

  if (type === "loading") {
    statusArea.innerHTML = "<span class=\"portfolio-spinner\"></span>Loading projects...";
    return;
  }

  if (!message) return;
  statusArea.textContent = message;
}

function renderProjects(projects) {
  container.innerHTML = "";
  projects.forEach((project) => container.appendChild(createCard(project)));
}

function getFilteredProjects() {
  const query = state.query.toLowerCase();
  let filtered = state.projects.filter((project) => project && project.fork === false);

  if (query) {
    filtered = filtered.filter((project) => {
      const name = project.name ? project.name.toLowerCase() : "";
      const description = project.description ? project.description.toLowerCase() : "";
      return name.includes(query) || description.includes(query);
    });
  }

  const sorted = filtered.slice();
  sorted.sort(
    (a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime()
  );

  return sorted;
}

function applyFilters() {
  if (!container) return;
  const filtered = getFilteredProjects();
  if (filtered.length === 0) {
    renderProjects([]);
    setStatus("empty", "No projects match the current filters.");
    return;
  }

  setStatus("none", "");
  renderProjects(filtered.slice(0, state.visibleCount));

  if (loadMoreButton) {
    loadMoreButton.classList.toggle("hidden", filtered.length <= state.visibleCount);
  }
}

async function loadProjects() {
  if (!container) return;
  const username = container.dataset.githubUser || DEFAULT_USER;
  const apiUrl = `https://api.github.com/users/${username}/repos`;
  let projects = [];

  setStatus("loading");
  container.innerHTML = "";

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      setStatus("error", "Could not load projects right now.");
      state.projects = [];
      renderProjects([]);
      return;
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      setStatus("empty", "No projects available at the moment.");
      state.projects = [];
      renderProjects([]);
      return;
    }

    projects = data;
  } catch (error) {
    setStatus("error", "Could not load projects right now.");
    state.projects = [];
    renderProjects([]);
    return;
  }

  state.projects = projects;
  state.visibleCount = PAGE_SIZE;
  applyFilters();
}

if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    state.visibleCount = PAGE_SIZE;
    applyFilters();
  });
}

if (loadMoreButton) {
  loadMoreButton.addEventListener("click", () => {
    const filtered = getFilteredProjects();
    state.visibleCount = filtered.length;
    applyFilters();
  });
}

// Only initialize the projects loader when the portfolio container exists on the page.
if (container) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadProjects);
  } else {
    loadProjects();
  }
} else {
  console.debug("No portfolio container found; skipping GitHub load.");
}

function validateContactField(field) {
  const error = document.getElementById(`${field.id}-error`);
  if (!error) return true;

  const value = field.value.trim();
  let message = "";

  if (!value) {
    message = `${field.labels[0].textContent} is required.`;
  } else if (field.id === "name" && (value.length < 2 || value.length > 80)) {
    message = "Name must be between 2 and 80 characters.";
  } else if (field.id === "email" && !field.validity.valid) {
    message = "Enter a valid email address.";
  } else if (field.id === "message" && (value.length < 10 || value.length > 2000)) {
    message = "Message must be between 10 and 2,000 characters.";
  }

  error.textContent = message;
  field.classList.toggle("form-field-error", Boolean(message));
  field.setAttribute("aria-invalid", String(Boolean(message)));
  return !message;
}

function validateContactForm(form) {
  const fields = [...form.querySelectorAll("input, textarea")];
  const isValid = fields.every(validateContactField);
  if (!isValid) {
    const firstInvalidField = fields.find((field) => field.getAttribute("aria-invalid") === "true");
    firstInvalidField?.focus();
  }
  return isValid;
}

/* Contact form helper: validate and intercept submission if form has data-formspree-id */
document.addEventListener("submit", async (e) => {
  const form = e.target;
  if (form && form.matches && form.matches("form[data-formspree-id]")) {
    e.preventDefault();
    const feedback = form.querySelector(".form-feedback");
    feedback.classList.remove("form-success", "form-error-state");
    feedback.textContent = "";

    if (!validateContactForm(form)) {
      feedback.classList.add("form-error-state");
      feedback.textContent = "Please correct the highlighted fields.";
      return;
    }

    const id = form.dataset.formspreeId;
    const url = `https://formspree.io/f/${id}`;
    const formData = new FormData(form);
    const submitButton = form.querySelector("button[type=\"submit\"]");
    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    feedback.textContent = "Sending message...";

    try {
      const res = await fetch(url, { method: "POST", body: formData, headers: { Accept: "application/json" } });
      if (res.ok) {
        form.reset();
        form.querySelectorAll("input, textarea").forEach((field) => {
          field.removeAttribute("aria-invalid");
          field.classList.remove("form-field-error");
          document.getElementById(`${field.id}-error`).textContent = "";
        });
        feedback.textContent = "Message sent — thank you!";
        feedback.classList.add("form-success");
      } else {
        feedback.textContent = "Sending failed. Please try again later.";
        feedback.classList.add("form-error-state");
      }
    } catch (err) {
      feedback.textContent = "Sending failed. Please try again later.";
      feedback.classList.add("form-error-state");
    } finally {
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-busy");
    }
  }
});

const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.querySelectorAll("input, textarea").forEach((field) => {
    field.addEventListener("blur", () => validateContactField(field));
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") validateContactField(field);
    });
  });
}
