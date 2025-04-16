document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const authScreen = document.getElementById("auth-screen");
  const appContainer = document.getElementById("app-container");
  const pinInputs = document.querySelectorAll(".pin-input");
  const submitPinBtn = document.getElementById("submit-pin");
  const authMessage = document.getElementById("auth-message");

  // Constants
  const AUTH_SESSION_KEY = "sesherz_auth_verified";
  const MAX_PIN_ATTEMPTS = 5;

  // State
  let pinAttempts = 0;

  // Check if already authenticated in this session
  const isAuthenticated = sessionStorage.getItem(AUTH_SESSION_KEY) === "true";

  if (isAuthenticated) {
    showMainApp();
  } else {
    setupAuthForm();
  }

  function setupAuthForm() {
    // Focus first input
    setTimeout(() => {
      pinInputs[0].focus();
    }, 500);

    // Handle pin input auto-advance
    pinInputs.forEach((input, index) => {
      // Only allow numbers
      input.addEventListener("input", (e) => {
        const inputValue = e.target.value;

        // Filter out non-numeric characters
        if (!/^\d*$/.test(inputValue)) {
          e.target.value = inputValue.replace(/\D/g, "");
          return;
        }

        // If input has a value, focus on next input
        if (inputValue && index < pinInputs.length - 1) {
          pinInputs[index + 1].focus();
        }
      });

      // Handle backspace to go back to previous input
      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !e.target.value && index > 0) {
          pinInputs[index - 1].focus();
        }
      });
    });

    // Handle submit button click
    submitPinBtn.addEventListener("click", verifyPin);

    // Allow submitting with Enter key when last input is focused
    pinInputs[pinInputs.length - 1].addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        verifyPin();
      }
    });
  }

  function verifyPin() {
    // Increase attempts count
    pinAttempts++;

    // Collect pin values
    const pinValues = [];
    pinInputs.forEach((input) => {
      pinValues.push(input.value);
    });

    // Check if the pin is complete
    if (pinValues.includes("")) {
      showError("Please enter all 6 digits");
      return;
    }

    const enteredPin = pinValues.join("");

    // Show loading state
    submitPinBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    submitPinBtn.disabled = true;

    // Check pin against Firestore
    db.collection("pin")
      .doc("access")
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().value === enteredPin) {
          // Correct PIN
          authMessage.textContent = "";
          authMessage.style.color = "var(--success-color)";
          authMessage.textContent = "Access granted! Loading...";

          // Store authentication state in session storage
          sessionStorage.setItem(AUTH_SESSION_KEY, "true");

          // Show main app
          setTimeout(showMainApp, 1000);
        } else {
          // Incorrect PIN
          handleIncorrectPin();
        }
      })
      .catch((error) => {
        console.error("Error verifying PIN:", error);
        showError("Error verifying PIN. Please try again.");
        resetSubmitButton();
      });
  }

  function handleIncorrectPin() {
    // Check if max attempts reached
    if (pinAttempts >= MAX_PIN_ATTEMPTS) {
      showError(`Too many attempts. Please try again later.`);
      submitPinBtn.disabled = true;
      return;
    }

    // Show error message
    showError(
      `Incorrect PIN. ${MAX_PIN_ATTEMPTS - pinAttempts} attempts remaining.`
    );

    // Shake effect
    pinInputs.forEach((input) => {
      input.classList.add("shake");
      setTimeout(() => {
        input.classList.remove("shake");
      }, 500);
    });

    // Clear inputs
    pinInputs.forEach((input) => {
      input.value = "";
    });

    // Focus first input
    pinInputs[0].focus();

    // Reset submit button
    resetSubmitButton();
  }

  function showError(message) {
    authMessage.style.color = "var(--danger-color)";
    authMessage.textContent = message;
  }

  function resetSubmitButton() {
    submitPinBtn.innerHTML = '<i class="fas fa-lock-open"></i> Unlock Access';
    submitPinBtn.disabled = false;
  }

  function showMainApp() {
    authScreen.classList.add("hidden");
    appContainer.classList.remove("hidden");
  }
});
