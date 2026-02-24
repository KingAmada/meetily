(function registerPwa() {
  const installButtons = Array.from(document.querySelectorAll("[data-install-app-btn]"));
  let deferredPrompt = null;

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  function setInstallState(state) {
    const labels = {
      available: "Install App",
      unavailable: isIos ? "Add to Home Screen" : "Install App",
      pending: "Opening...",
      installed: "Installed",
      unsupported: "Use HTTPS to Install"
    };
    installButtons.forEach((btn) => {
      btn.dataset.installState = state;
      btn.textContent = labels[state] || "Install App";
      btn.disabled = state === "pending";
      btn.hidden = state === "installed";
    });
  }

  async function onInstallClick() {
    if (!deferredPrompt) {
      if (isIos) {
        window.alert("To install: tap Share, then choose 'Add to Home Screen'.");
      } else {
        window.alert("Install is not currently available in this browser session.");
      }
      return;
    }

    setInstallState("pending");
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice.catch(() => null);
    deferredPrompt = null;
    if (choice && choice.outcome === "accepted") {
      setInstallState("installed");
    } else {
      setInstallState("unavailable");
    }
  }

  installButtons.forEach((btn) => btn.addEventListener("click", onInstallClick));

  if (isStandalone) {
    setInstallState("installed");
    return;
  }

  setInstallState("unavailable");

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js", { scope: "./" }).catch(() => {
        // Silent failure keeps the app usable even if SW registration is blocked.
      });
    });
  } else {
    setInstallState("unsupported");
    return;
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    setInstallState("available");
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    setInstallState("installed");
  });
})();
