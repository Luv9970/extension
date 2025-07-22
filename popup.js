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
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ api_key: apiKey })
    });

    if (!res.ok) {
      throw new Error("API key verification failed");
    }

    const data = await res.json();

    // Save both API key and account details
    await chrome.storage.local.set({
      apiKey,
      account: data.user_details
    });

    status.textContent = "Key verified and saved!";
    status.style.color = "green";

    const { pendingImageUrl } = await chrome.storage.local.get("pendingImageUrl");
      if (pendingImageUrl) {
        chrome.runtime.sendMessage({ action: "runAltText", imageUrl: pendingImageUrl });
        await chrome.storage.local.remove("pendingImageUrl");
      }

      setTimeout(() => window.close(), 3000);

  } catch (err) {
    console.error("Verification error:", err);
    status.textContent = "Unable to verify the key.";
    status.style.color = "red";
  }
});
