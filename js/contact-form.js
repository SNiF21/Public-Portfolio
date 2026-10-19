const NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9 ()-]+$/;

function validateContactField(field) {
  const error = document.getElementById(`${field.id}-error`);
  if (!error) return true;

  const value = field.value.trim();
  let message = "";

  if (!value && field.id !== "phone") {
    message = `${field.labels[0].textContent} is required.`;
  } else if (field.id === "name" && (value.length < 2 || value.length > 80 || !NAME_PATTERN.test(value))) {
    message = "Name must contain at least 2 letters and spaces only.";
  } else if (field.id === "email" && !EMAIL_PATTERN.test(value)) {
    message = "Enter a valid email address.";
  } else if (field.id === "phone" && value && !PHONE_PATTERN.test(value)) {
    message = "Phone may contain numbers, spaces, dashes, and parentheses.";
  } else if (field.id === "message" && (value.length < 10 || value.length > 1000)) {
    message = "Message must be between 10 and 1,000 characters.";
  }

  error.textContent = message;
  field.classList.toggle("form-field-error", Boolean(message));
  field.setAttribute("aria-invalid", String(Boolean(message)));
  if (field.id === "message") {
    document.getElementById("message-count").textContent = `${value.length} / 1000 characters`;
  }
  return !message;
}

function validateContactForm(form) {
  const fields = [...form.querySelectorAll("input, textarea")];
  const isValid = fields.every(validateContactField);
  if (!isValid) {
    fields.find((field) => field.getAttribute("aria-invalid") === "true")?.focus();
  }
  return isValid;
}

document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!form?.matches("form[data-formspree-id]")) return;

  event.preventDefault();
  const feedback = form.querySelector(".form-feedback");
  feedback.classList.remove("form-success", "form-error-state");
  feedback.textContent = "";

  if (!validateContactForm(form)) {
    feedback.classList.add("form-error-state");
    feedback.textContent = "Please correct the highlighted fields.";
    return;
  }

  const submitButton = form.querySelector("button[type=\"submit\"]");
  submitButton.disabled = true;
  submitButton.setAttribute("aria-busy", "true");
  feedback.textContent = "Sending message...";

  try {
    const response = await fetch(`https://formspree.io/f/${form.dataset.formspreeId}`, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Form submission failed");

    form.reset();
    form.querySelectorAll("input, textarea").forEach((field) => {
      field.removeAttribute("aria-invalid");
      field.classList.remove("form-field-error");
      document.getElementById(`${field.id}-error`).textContent = "";
    });
    document.getElementById("message-count").textContent = "0 / 1000 characters";
    feedback.textContent = "Message sent — thank you!";
    feedback.classList.add("form-success");
  } catch (error) {
    feedback.textContent = "Sending failed. Please try again later.";
    feedback.classList.add("form-error-state");
  } finally {
    submitButton.disabled = false;
    submitButton.removeAttribute("aria-busy");
  }
});

const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.querySelectorAll("input, textarea").forEach((field) => {
    field.addEventListener("blur", () => validateContactField(field));
    field.addEventListener("input", () => {
      if (field.id === "message") {
        document.getElementById("message-count").textContent = `${field.value.trim().length} / 1000 characters`;
      }
      if (field.getAttribute("aria-invalid") === "true") validateContactField(field);
    });
  });
}
