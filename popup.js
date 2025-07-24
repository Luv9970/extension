document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("main-container");

  const { apiKey, account } = await chrome.storage.local.get(["apiKey", "account"]);

  if (apiKey && account) {
    renderVerifiedUI(container, account);
    
    // Listen for credit updates from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "updateCredits") {
        updateCreditsDisplay(message.credits);
      }
    });
    
    return;
  }

  // If not verified, show input form
  container.innerHTML = `
    <div class="section">
        <div class="section-title">Enter your API key</div>
        <div class="api-key-group">
            <input type="text" id="apiKeyInput" class="api-key-input" />
            <button id="verifyBtn" class="verify-btn">Verify</button>
        </div>
        <p class="api-note">Don’t have one? <a class="api-link" href="https://altmagic.vercel.app" target="_blank">Get an API key</a></p>
        <div id="status" class="status-message"></div>
    </div>
  `;

  document.getElementById("verifyBtn").addEventListener("click", async () => {
    const apiKey = document.getElementById("apiKeyInput").value.trim();
    const status = document.getElementById("status");

    if (!apiKey) {
      status.textContent = "Please enter an API key.";
      status.style.color = "red";
      return;
    }

    status.textContent = "⏳ Verifying...";
    status.style.color = "black";

    try {
      const res = await fetch("https://alt-magic-api-eabaa2c8506a.herokuapp.com/chrome-extension-verify-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey }),
      });

      if (!res.ok) throw new Error("API key verification failed");

      const data = await res.json();

      const userDetails = data.user_details;
      await chrome.storage.local.set({
        apiKey,
        account: userDetails,
      });

      // Check for pending image and trigger generation
      const { pendingImageUrl } = await chrome.storage.local.get("pendingImageUrl");
      if (pendingImageUrl) {
        chrome.runtime.sendMessage({ action: "runAltText", imageUrl: pendingImageUrl });
        await chrome.storage.local.remove("pendingImageUrl");
      }

      // Replace input UI with verified UI
      renderVerifiedUI(container, userDetails);

      // Auto-close after 3s (optional)
      setTimeout(() => window.close(), 3000);

    } catch (err) {
      console.error("Verification error:", err);
      status.textContent = "❌ Unable to verify the key.";
      status.style.color = "red";
    }
  });
});

function renderVerifiedUI(container, userDetails) {
  const initials = userDetails.user_name
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase();

  container.innerHTML = `
    <div class="section">
        <div class="section-title">Verified Account</div>
        <div class="account-info">
            <div class="avatar">${initials}</div>
            <div class="account-details">
                <h3>${userDetails.user_name}</h3>
                <p>${userDetails.email}</p>
            </div>
        </div>
    </div>
    <div class="divider"></div>
    <div class="section">
        <div class="section-title">Alt Text Credits</div>
        <div class="credits-display" id="creditsDisplay">${userDetails.credits_available ?? "0"}</div>
    </div>
    <div class="divider"></div>
    <div class="section">
        <a href="#" class="remove-link" id="removeApiKey">Remove Key</a>
        <span class="remove-note">Clear saved credentials.</span>
    </div>
  `;

  document.getElementById("removeApiKey").addEventListener("click", async () => {
    await chrome.storage.local.remove(["apiKey", "account"]);
    window.location.reload();
  });
}

function updateCreditsDisplay(newCredits) {
  const creditsDisplay = document.getElementById("creditsDisplay");
  if (creditsDisplay) {
    creditsDisplay.textContent = newCredits;
    
    // Optional: Add a brief highlight animation to show the update
    creditsDisplay.style.backgroundColor = "#4CAF50";
    creditsDisplay.style.color = "white";
    creditsDisplay.style.transition = "all 0.3s ease";
    
    setTimeout(() => {
      creditsDisplay.style.backgroundColor = "";
      creditsDisplay.style.color = "";
    }, 1000);
  }
}
