(() => {
  "use strict";

  const TARGET = {
    hostname: "192.168.1.254",
    port: "8090",
    path: "/httpclient.html"
  };

  let loginAttempted = false;

  function isTargetPage() {
    return (
      location.hostname === TARGET.hostname &&
      location.port === TARGET.port &&
      location.pathname === TARGET.path
    );
  }

  function isVisible(el) {
    if (!el) return false;

    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  function setInputValue(input, value) {
    // Use the native setter so React/jQuery-style input handlers
    // and normal DOM listeners receive the change.
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )?.set;

    if (setter) {
      setter.call(input, value);
    } else {
      input.value = value;
    }

    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function findUsername() {
    const selectors = [
      'input[name="username"]',
      'input[name="user"]',
      'input[id="username"]',
      'input[id="user"]',
      'input[placeholder*="username" i]',
      'input[placeholder*="user" i]',
      'input[type="text"]'
    ];

    for (const selector of selectors) {
      const input = document.querySelector(selector);
      if (input && isVisible(input)) return input;
    }

    // Last-resort fallback: visible non-password input.
    return [...document.querySelectorAll("input")].find(input =>
      isVisible(input) &&
      input.type !== "password" &&
      input.type !== "hidden"
    );
  }

  function findPassword() {
    const selectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[id="password"]',
      'input[placeholder*="password" i]'
    ];

    for (const selector of selectors) {
      const input = document.querySelector(selector);
      if (input && isVisible(input)) return input;
    }

    return null;
  }

  function findLoginButton() {
    const candidates = [
      ...document.querySelectorAll(
        'button, input[type="submit"], input[type="button"], a'
      )
    ].filter(isVisible);

    // 1. Prefer an actual submit control.
    const submit = candidates.find(el =>
      (el.matches('button[type="submit"], input[type="submit"]'))
    );
    if (submit) return submit;

    // 2. Match the visible text/value in the screenshot: "Sign in".
    const login = candidates.find(el => {
      const text = (
        el.innerText ||
        el.value ||
        el.textContent ||
        ""
      ).trim().replace(/\s+/g, " ").toLowerCase();

      return (
        text === "sign in" ||
        text === "signin" ||
        text === "login" ||
        text === "log in" ||
        text === "submit"
      );
    });

    if (login) return login;

    // 3. Broader text match.
    return candidates.find(el => {
      const text = (
        el.innerText ||
        el.value ||
        el.textContent ||
        ""
      ).trim().toLowerCase();

      return /\bsign\s*in\b|\blog\s*in\b|\blogin\b|\bsubmit\b/.test(text);
    }) || null;
  }

  function triggerRealisticClick(element) {
    if (!element) return false;

    // Focus first.
    try { element.focus(); } catch (_) {}

    // Normal DOM click.
    try {
      element.click();
      return true;
    } catch (_) {}

    // Fallback mouse events.
    try {
      for (const type of ["mousedown", "mouseup", "click"]) {
        element.dispatchEvent(new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          view: window
        }));
      }
      return true;
    } catch (_) {}

    return false;
  }

  function submitLoginForm(passwordInput) {
    const form = passwordInput?.closest("form");

    if (!form) return false;

    // First try the form's submit control.
    const submitControl = form.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    if (submitControl && isVisible(submitControl)) {
      return triggerRealisticClick(submitControl);
    }

    // requestSubmit() triggers normal form validation and submit events.
    try {
      if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
        return true;
      }
    } catch (_) {}

    // Last fallback.
    try {
      HTMLFormElement.prototype.submit.call(form);
      return true;
    } catch (_) {}

    return false;
  }

  function autoLogin() {
    if (!isTargetPage() || loginAttempted) return;

    const username = findUsername();
    const password = findPassword();

    if (!username || !password) return;

    // Fill credentials.
    setInputValue(username, ABES_CONFIG.username);
    setInputValue(password, ABES_CONFIG.password);

    // Wait briefly so the portal can process the input/change events.
    setTimeout(() => {
      const button = findLoginButton();

      if (button) {
        loginAttempted = triggerRealisticClick(button);

        // Some portals attach the handler after page load.
        if (!loginAttempted) {
          submitLoginForm(password);
        }
        return;
      }

      // If the button is not directly found, submit its form.
      loginAttempted = submitLoginForm(password);
    }, 500);
  }

  // Initial attempts.
  autoLogin();
  setTimeout(autoLogin, 500);
  setTimeout(autoLogin, 1500);
  setTimeout(autoLogin, 3000);

  // The portal may create the login controls dynamically.
  const observer = new MutationObserver(() => {
    if (!loginAttempted) autoLogin();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Stop watching after 15 seconds.
  setTimeout(() => observer.disconnect(), 15000);
})();
