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
  loading: "flex items-center gap-2 text-sm text-stone-500",
  error: "text-sm text-stone-600",
  empty: "text-sm text-stone-500",
  none: "text-sm text-stone-500",
};

function createCard(project) {
  const card = document.createElement("article");
  card.className = "rounded-lg border border-stone-200 bg-white p-4";

  const title = document.createElement("h3");
  title.className = "text-base font-medium text-stone-900";
  title.textContent = project.name || "Untitled project";

  const description = document.createElement("p");
  description.className = "mt-2 text-sm text-stone-600";
  description.textContent = project.description || "No description available";

  const meta = document.createElement("div");
  meta.className = "mt-3 space-y-1 text-xs text-stone-500";

  const language = document.createElement("span");
  language.style.display = "block";
  language.textContent = project.language ? `Language: ${project.language}` : "Language: N/A";

  const stars = document.createElement("span");
  stars.style.display = "block";
  stars.textContent = `Stars: ${project.stargazers_count ?? 0}`;

  const link = document.createElement("a");
  link.className = "text-xs font-semibold text-stone-700 underline hover:text-stone-900";
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
    statusArea.innerHTML =
      "<span class=\"portfolio-spinner\"></span>Loading projects...";
    return;
  }

  if (!message) {
    return;
  }

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
    (a, b) =>
      new Date(b.updated_at ?? 0).getTime() -
      new Date(a.updated_at ?? 0).getTime()
  );

  return sorted;
}

function applyFilters() {
  if (!container) {
    return;
  }

  const filtered = getFilteredProjects();

  if (filtered.length === 0) {
    renderProjects([]);
    setStatus("empty", "No projects match the current filters.");
    return;
  }

  setStatus("none", "");
  renderProjects(filtered.slice(0, state.visibleCount));

  if (loadMoreButton) {
    loadMoreButton.classList.toggle(
      "hidden",
      filtered.length <= state.visibleCount
    );
  }
}

async function loadProjects() {
  if (!container) {
    return;
  }

  const username = container.dataset.githubUser || DEFAULT_USER;
  const apiUrl = `https://api.github.com/users/${username}/repos`;
  let projects = [];

  setStatus("loading");
  container.innerHTML = "";

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      setStatus("error", "Ups! Nu am putut incarca proiectele momentan. :)");
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
    setStatus("error", "Ups! Nu am putut incarca proiectele momentan. :O");
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
  // No portfolio container on this page (e.g. homepage). Skip GitHub API calls.
  console.debug("No portfolio container found; skipping GitHub load.");
}
