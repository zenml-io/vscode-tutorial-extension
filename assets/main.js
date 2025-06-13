// @ts-check
// This script will be run within the webview itself

// It cannot access the main VS Code APIs directly.
(function () {
  //@ts-ignore
  const vscode = acquireVsCodeApi();

  // Initialize the interactive tutorial system
  initializeInteractiveTutorial();

  // Check if this is the completion screen and trigger confetti
  if (document.body.classList.contains("completion-screen")) {
    // Delay confetti slightly to let the page render
    setTimeout(() => {
      triggerCelebration();
    }, 500);
  }

  // Welcome screen start button handler
  const welcomeStartButton = document.querySelector(".welcome-start-button");
  if (welcomeStartButton) {
    welcomeStartButton.addEventListener("click", function () {
      vscode.postMessage({ type: "next" });
    });
  }

  // Handle breadcrumb toggle
  const breadcrumbToggle = document.getElementById("breadcrumb-toggle");
  const breadcrumbTrail = document.getElementById("breadcrumb-trail");

  if (breadcrumbToggle && breadcrumbTrail) {
    breadcrumbToggle.addEventListener("click", function () {
      const isExpanded = breadcrumbTrail.classList.contains("expanded");
      breadcrumbTrail.classList.toggle("expanded");

      // Update toggle button icon
      const chevronIcon = breadcrumbToggle.querySelector(
        ".codicon-chevron-down, .codicon-chevron-up"
      );
      if (chevronIcon) {
        if (isExpanded) {
          chevronIcon.className = "codicon codicon-chevron-down";
        } else {
          chevronIcon.className = "codicon codicon-chevron-up";
        }
      }
    });
  }

  // Handle breadcrumb item clicks
  const breadcrumbItems = document.querySelectorAll(".breadcrumb-item");
  breadcrumbItems.forEach((item) => {
    item.addEventListener("click", function () {
      const sectionIndex = parseInt(this.dataset.section);
      if (!isNaN(sectionIndex)) {
        vscode.postMessage({
          type: "openSection",
          id: sectionIndex,
        });

        // Close breadcrumb trail after selection
        if (breadcrumbTrail) {
          breadcrumbTrail.classList.remove("expanded");
          const chevronIcon = breadcrumbToggle?.querySelector(".codicon-chevron-up");
          if (chevronIcon) {
            chevronIcon.className = "codicon codicon-chevron-down";
          }
        }
      }
    });
  });

  // Enhanced keyboard navigation
  document.addEventListener("keydown", function (event) {
    // Toggle breadcrumb with Ctrl+B
    if (event.key === "b" && event.ctrlKey) {
      if (breadcrumbToggle) {
        breadcrumbToggle.click();
      }
      event.preventDefault();
    }

    // Run code/pipeline with Ctrl+Enter
    if (event.key === "Enter" && event.ctrlKey) {
      const runButton =
        document.getElementById("runCodeFile") ||
        document.querySelector(".run-code") ||
        document.querySelector(".run-pipeline-button");
      if (runButton) {
        runButton.click();
      }
      event.preventDefault();
    }

    // Quick navigation with Ctrl+Arrow keys
    if (event.key === "ArrowLeft" && event.ctrlKey) {
      const prevButton = document.getElementById("nav-previous");
      // @ts-ignore
      if (prevButton && !prevButton.disabled) {
        prevButton.click();
      }
      event.preventDefault();
    }

    if (event.key === "ArrowRight" && event.ctrlKey) {
      const nextButton = document.getElementById("nav-next");
      // @ts-ignore
      if (nextButton && !nextButton.disabled) {
        nextButton.click();
      }
      event.preventDefault();
    }
  });

  // Add smooth scrolling when navigating
  function smoothScrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // Attach smooth scroll to navigation clicks
  const navButtons = document.querySelectorAll("#nav-previous, #nav-next");
  navButtons.forEach((button) => {
    button.addEventListener("click", function () {
      setTimeout(smoothScrollToTop, 100);
    });
  });

  // Handle responsive navigation collapse
  function handleResponsiveNavigation() {
    const container = /** @type {HTMLElement} */ (document.querySelector(".tutorial-header"));
    if (!container) {
      return;
    }

    const containerWidth = container.offsetWidth;

    // Add classes based on container width
    if (containerWidth < 480) {
      container.classList.add("nav-compact");
    } else {
      container.classList.remove("nav-compact");
    }

    if (containerWidth < 768) {
      container.classList.add("nav-mobile");
    } else {
      container.classList.remove("nav-mobile");
    }
  }

  // Initial check and resize listener
  handleResponsiveNavigation();
  window.addEventListener("resize", handleResponsiveNavigation);

  // Observer for dynamic content changes
  if (typeof ResizeObserver !== "undefined") {
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        handleResponsiveNavigation();
      }
    });

    const headerContainer = document.querySelector(".tutorial-header");
    if (headerContainer) {
      resizeObserver.observe(headerContainer);
    }
  }

  // Add tooltip functionality for truncated text
  function addTooltips() {
    const titleElement = document.querySelector(".tutorial-title");
    if (titleElement && titleElement.scrollWidth > titleElement.clientWidth) {
      // @ts-ignore - title exists on HTMLElement
      titleElement.title = titleElement.textContent;
    }

    const breadcrumbLabels = document.querySelectorAll(".breadcrumb-label");
    breadcrumbLabels.forEach((label) => {
      if (label.scrollWidth > label.clientWidth) {
        // @ts-ignore - title exists on HTMLElement
        label.title = label.textContent;
      }
    });
  }

  // Run tooltip setup after content loads
  setTimeout(addTooltips, 100);

  // COPY BUTTON FUNCTIONALITY
  function initializeCopyButtons() {
    // Add click event listeners to all code blocks for copy functionality
    document.querySelectorAll("pre").forEach((pre) => {
      pre.addEventListener("click", function (e) {
        // Check if the click was on the copy button area (top-right corner)
        const rect = pre.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Copy button is positioned at top: 12px, right: 12px, size: 24x24
        const buttonLeft = rect.width - 36; // 12px from right + 24px width
        const buttonTop = 12;
        const buttonRight = rect.width - 12;
        const buttonBottom = 36; // 12px from top + 24px height

        if (
          clickX >= buttonLeft &&
          clickX <= buttonRight &&
          clickY >= buttonTop &&
          clickY <= buttonBottom
        ) {
          // Get the code content
          const codeElement = pre.querySelector("code");
          if (codeElement) {
            const codeText = codeElement.textContent || codeElement.innerText;

            // Copy to clipboard
            navigator.clipboard
              .writeText(codeText)
              .then(() => {
                // Show brief feedback
                showCopyFeedback(pre);
              })
              .catch((err) => {
                console.error("Failed to copy code: ", err);
                // Fallback for older browsers
                fallbackCopyTextToClipboard(codeText, pre);
              });
          }
        }
      });
    });
  }

  function showCopyFeedback(preElement) {
    // Create a temporary feedback element
    const feedback = document.createElement("div");
    feedback.textContent = "Copied!";
    feedback.style.cssText = `
      position: absolute;
      top: 8px;
      right: 50px;
      background: var(--vscode-editor-background);
      color: var(--vscode-titleBar-activeForeground);
      border: 1px solid var(--vscode-sideBar-border);
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 11px;
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      z-index: 1000;
      pointer-events: none;
      opacity: 1;
      transition: opacity 0.3s ease;
    `;

    preElement.style.position = "relative";
    preElement.appendChild(feedback);

    // Fade out and remove after 1.5 seconds
    setTimeout(() => {
      feedback.style.opacity = "0";
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.remove();
        }
      }, 300);
    }, 1200);
  }

  function fallbackCopyTextToClipboard(text, preElement) {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand("copy");
      if (successful) {
        showCopyFeedback(preElement);
      }
    } catch (err) {
      console.error("Fallback: Oops, unable to copy", err);
    }

    document.body.removeChild(textArea);
  }

  // Initialize copy buttons after DOM is loaded
  setTimeout(initializeCopyButtons, 100);

  // EVENT LISTENERS

  document.querySelectorAll(".section").forEach((element) => {
    element.addEventListener("click", (e) => {
      //@ts-ignore
      const id = parseInt(e.target?.dataset.id, 10);
      handleOpenSection(id);
    });
  });

  document.querySelector(".reset-section")?.addEventListener("click", (element) => {
    //@ts-ignore for dataset
    const id = parseInt(element.target?.dataset.id, 10);
    handleReset();
  });

  document.querySelector(".reset-code")?.addEventListener("click", () => {
    handleResetCode();
  });

  document.getElementById("zenml-server-connect")?.addEventListener("click", () => {
    handleServerConnect();
  });

  document.getElementById("local-server-connect")?.addEventListener("click", () => {
    handleConnectToLocalDashboard();
  });

  document.getElementById("next")?.addEventListener("click", () => {
    handleNext();
  });

  document.getElementById("previous")?.addEventListener("click", () => {
    handlePrevious();
  });

  document.getElementById("edit-text")?.addEventListener("click", () => {
    vscode.postMessage({ type: "editText" });
  });

  document.querySelectorAll(".run-code").forEach((element) => {
    element.addEventListener("click", () => {
      handleRunCode();
    });
  });

  // Enhanced run pipeline button handler
  document.querySelectorAll(".run-pipeline-button").forEach((element) => {
    element.addEventListener("click", () => {
      handleRunPipeline();
    });
  });

  // Simple navigation buttons
  document.getElementById("nav-previous")?.addEventListener("click", () => {
    const button = document.getElementById("nav-previous");
    //@ts-ignore
    if (button && !button.disabled) {
      handlePrevious();
    }
  });

  document.getElementById("nav-next")?.addEventListener("click", () => {
    const button = document.getElementById("nav-next");
    //@ts-ignore
    if (button && !button.disabled) {
      handleNext();
    }
  });

  // Enhanced action button handlers for the new header buttons
  document.getElementById("runCodeFile")?.addEventListener("click", function () {
    handleRunCode();
  });

  document.getElementById("resetCodeFile")?.addEventListener("click", function () {
    handleResetCode();
  });

  // Dashboard link
  document.getElementById("dashboard-url")?.addEventListener("click", (e) => {
    e.preventDefault();
    //@ts-ignore
    const url = e.target.href;
    if (url) {
      vscode.postMessage({ type: "openDashboard", url: url });
    }
  });

  // PROGRESS BAR HANDLING

  const progressElement = document.querySelector("#progress");
  if (progressElement) {
    //@ts-ignore for dataset
    const start = parseInt(progressElement.dataset.current, 10);
    //@ts-ignore for dataset
    const end = parseInt(progressElement.dataset.end, 10);
    if (start === 1) {
      //@ts-ignore for style
      progressElement.style.width = `${start / end}%`;
    } else {
      //@ts-ignore for style
      progressElement.style.width = `${(start / end) * 100}%`;
    }
  }

  // Enhanced progress bar
  const enhancedProgressElement = document.querySelector("#enhanced-progress");
  if (enhancedProgressElement) {
    //@ts-ignore for dataset
    const start = parseInt(enhancedProgressElement.dataset.current, 10);
    //@ts-ignore for dataset
    const end = parseInt(enhancedProgressElement.dataset.end, 10);
    const percentage = (start / end) * 100;
    //@ts-ignore for style
    enhancedProgressElement.style.width = `${percentage}%`;
  }

  // INITIALIZATION FUNCTIONS

  function initializeInteractiveTutorial() {
    // Listen for messages from the extension
    window.addEventListener("message", (event) => {
      const message = event.data;
      switch (message.type) {
        case "pipelineStatusUpdate":
          updatePipelineStatus(message.status);
          break;
        case "pipelineCompleted":
          handlePipelineCompleted();
          break;
        case "pipelineFailed":
          handlePipelineFailed(message.error);
          break;
        case "progressUpdate":
          updateProgress(message.current, message.total);
          break;
        case "showDashboardUrl":
          showDashboardUrl(message.url);
          break;
      }
    });
  }

  function updatePipelineStatus(status) {
    const statusElement = document.querySelector(".pipeline-status");
    const runButton = document.querySelector(".run-pipeline-button");

    if (statusElement) {
      statusElement.className = `pipeline-status ${status}`;
      const statusTexts = {
        initializing: "Initializing pipeline...",
        running: "Pipeline running...",
        completed: "Pipeline completed successfully!",
        failed: "Pipeline failed",
        cached: "Pipeline completed (cached)",
      };
      statusElement.textContent = statusTexts[status] || status;
    }

    if (runButton) {
      runButton.className = `run-pipeline-button ${status}`;
      const buttonTexts = {
        initializing: "Initializing...",
        running: "Running...",
        completed: "Completed ✓",
        failed: "Failed ✗",
        cached: "Cached ✓",
      };

      if (status === "running" || status === "initializing") {
        runButton.innerHTML = `<div class="spinner"></div> ${buttonTexts[status]}`;
        //@ts-ignore
        runButton.disabled = true;
      } else if (status === "completed" || status === "cached") {
        runButton.innerHTML = `<i class="checkmark">✓</i> ${buttonTexts[status]}`;
        //@ts-ignore
        runButton.disabled = true;
        runButton.style.cursor = "default";
      } else if (status === "failed") {
        runButton.innerHTML = `<i class="codicon codicon-error"></i> ${buttonTexts[status]}`;
        //@ts-ignore
        runButton.disabled = false;
      }
    }
  }

  function handlePipelineCompleted() {
    // Activate pulsating next button
    setTimeout(() => {
      triggerNextButtonPulse();
    }, 1500);
  }

  function showDashboardUrl(url) {
    const dashboardButton = document.getElementById("dashboard-button");

    if (dashboardButton) {
      //@ts-ignore
      dashboardButton.href = url;
      dashboardButton.style.display = "flex";
      
      // Add click handler to open in external browser
      dashboardButton.onclick = function(e) {
        e.preventDefault();
        vscode.postMessage({ type: "openDashboard", url: url });
      };
    }
  }

  function handlePipelineFailed(error) {
    console.error("Pipeline failed:", error);
    // Could show error details in UI
  }

  function triggerCelebration() {
    // Create multiple waves of confetti for a more impressive effect
    const waves = 3;
    const confettiPerWave = 20;

    for (let wave = 0; wave < waves; wave++) {
      setTimeout(() => {
        for (let i = 0; i < confettiPerWave; i++) {
          setTimeout(() => createConfetti(), i * 8); // Small delay between each piece
        }
      }, wave * 80); // Delay between waves
    }
  }

  function createConfetti() {
    const confetti = document.createElement("div");

    // Random confetti shapes
    const shapes = ["square", "circle", "rectangle", "triangle", "diamond"];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    confetti.className = `confetti ${shape}`;

    // Add flutter effect to some pieces
    if (Math.random() < 0.3) {
      confetti.classList.add("flutter");
    }

    // Get center point of the webview (explosion origin)
    // Use document dimensions instead of window dimensions for webview
    const centerX = document.documentElement.clientWidth / 2;
    const centerY = 0;

    // Random explosion parameters
    const angle = Math.random() * Math.PI * 2; // Full circle
    const velocity = Math.random() * 250 + 120; // Random velocity 120-370px
    const gravity = Math.random() * 300 + 150; // Gravity effect

    // Calculate trajectory with physics
    const dx = Math.cos(angle) * velocity + (Math.random() - 0.5) * 80;
    const dy = Math.sin(angle) * velocity + gravity;

    // Random rotation
    const rotation = Math.random() * 1440 - 720; // -720 to 720 degrees

    // Set CSS custom properties for the explosion animation
    confetti.style.setProperty("--dx", dx + "px");
    confetti.style.setProperty("--dy", dy + "px");
    confetti.style.setProperty("--rotation", rotation + "deg");

    // Position at explosion center
    confetti.style.left = centerX + "px";
    confetti.style.top = centerY + "px";

    // Set color based on shape
    const color = getRandomColor();
    if (shape === "triangle") {
      confetti.style.borderBottomColor = color;
    } else {
      confetti.style.backgroundColor = color;
    }

    // Random animation duration
    const duration = Math.random() * 1.5 + 2; // 2-3.5 seconds
    confetti.style.animation = `confetti-explode ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;

    // Add staggered delay
    confetti.style.animationDelay = Math.random() * 0.2 + "s";

    document.body.appendChild(confetti);

    // Clean up after animation
    setTimeout(() => {
      if (confetti.parentNode) {
        confetti.remove();
      }
    }, (duration + 0.2) * 1000);
  }

  function getRandomColor() {
    const colors = [
      "var(--vscode-charts-blue)",
      "var(--vscode-charts-green)",
      "var(--vscode-charts-yellow)",
      "var(--vscode-charts-red)",
      "var(--vscode-charts-purple)",
      "var(--vscode-charts-orange)",
      "#00D4FF", // Cyan
      "#FF6B6B", // Coral
      "#4ECDC4", // Teal
      "#45B7D1", // Light blue
      "#F9CA24", // Yellow
      "#6C5CE7", // Purple
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function updateProgress(current, total) {
    const progressElement = document.querySelector("#enhanced-progress");
    if (progressElement) {
      const percentage = (current / total) * 100;
      //@ts-ignore
      progressElement.style.width = `${percentage}%`;
    }
  }

  function triggerNextButtonPulse() {
    const nextButton = document.getElementById("nav-next");
    if (nextButton && !nextButton.classList.contains("disabled")) {
      nextButton.classList.add("pulse-ready");

      // Remove pulse when button is clicked
      nextButton.addEventListener("click", function removePulse() {
        nextButton.classList.remove("pulse-ready");
        nextButton.removeEventListener("click", removePulse);
      });
    }
  }

  // EVENT HANDLERS

  function handleServerConnect() {
    //@ts-ignore
    const url = document.getElementById("zenml-server-connect-input").value;
    vscode.postMessage({ type: "serverConnect", url });
  }

  function handleConnectToLocalDashboard() {
    vscode.postMessage({ type: "localServerConnect" });
  }

  function handleNext() {
    vscode.postMessage({ type: "next" });
  }

  function handlePrevious() {
    vscode.postMessage({ type: "previous" });
  }

  function handleRunCode() {
    vscode.postMessage({ type: "runCodeFile" });
  }

  function handleRunPipeline() {
    const button = document.querySelector(".run-pipeline-button");
    //@ts-ignore
    if (button && !button.disabled) {
      updatePipelineStatus("initializing");
      vscode.postMessage({ type: "runPipeline" });
    }
  }

  function handleResetCode() {
    vscode.postMessage({ type: "resetCodeFile" });
  }

  function handleOpenSection(id) {
    vscode.postMessage({ type: "openSection", id });
  }

  function handleReset() {
    vscode.postMessage({ type: "resetProgress" });
  }
})();
