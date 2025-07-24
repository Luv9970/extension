chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "generateAltText",
    title: "Generate Alt text",
    contexts: ["image"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "generateAltText") {
    const { apiKey, account, selectedLanguage } = await chrome.storage.local.get(["apiKey", "account", "selectedLanguage"]);
    
    console.log("API Key:", apiKey ? "Present" : "Missing");
    console.log("Account:", account);
    console.log("Selected Language:", selectedLanguage || "en (default)");

    // Save image URL temporarily
    await chrome.storage.local.set({ pendingImageUrl: info.srcUrl });

    if (!apiKey || !account) {
      console.log("Missing credentials, opening popup");
      chrome.action.openPopup();
    } else {
      const imageUrl = info.srcUrl;
      console.log("Image URL:", imageUrl);

      // Handle different image types
      let fileExtension, imageName;
      
      if (imageUrl.startsWith('data:image/')) {
        // For base64 data URLs
        const mimeMatch = imageUrl.match(/data:image\/([^;]+)/);
        fileExtension = mimeMatch ? mimeMatch[1] : 'jpg';
        imageName = `image.${fileExtension}`;
        console.log("Base64 image detected - Extension:", fileExtension, "Name:", imageName);
      } else {
        // For regular URLs
        fileExtension = imageUrl.split('.').pop().split('?')[0] || 'jpg';
        imageName = imageUrl.split('/').pop().split('?')[0] || `image.${fileExtension}`;
        console.log("Regular URL image - Extension:", fileExtension, "Name:", imageName);
      }

      const userId = account?.email;

      const requestBody = {
        image: imageUrl.startsWith('data:image/') ? imageUrl : "",
        title: "",
        context: "",
        keywords: [],
        user_id: userId,
        image_name: imageName,
        image_type: imageUrl.startsWith('data:image/') ? "base64" : "url",
        image_url: imageUrl.startsWith('data:image/') ? "" : imageUrl,
        alt_quality: "medium",
        file_extension: fileExtension,
        image_id: "",
        source: "",
        site_id: "",
        language: selectedLanguage || "en",
        model_type: "gemini",
        product_name: ""
      };

      try {
        console.log("Making API request with body:", requestBody);
        
        // Show loading state first
        runAltTextInjection(tab.id, imageUrl);
        
        const response = await fetch("https://alt-magic-api-eabaa2c8506a.herokuapp.com/alt-generator-chrm-ext", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey
          },
          body: JSON.stringify(requestBody)
        });

        console.log("Response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("API response data:", data);

        // Update the loading state with the result
        updateAltTextResult(tab.id, data?.alt_text || "Alt text not found");
        
        // Update credits in storage and notify popup
        if (data?.credits_available !== undefined) {
          console.log("Updating credits from", account?.credits_available, "to", data.credits_available);
          const { account: currentAccount } = await chrome.storage.local.get(["account"]);
          if (currentAccount) {
            currentAccount.credits_available = data.credits_available;
            await chrome.storage.local.set({ account: currentAccount });
            console.log("Credits updated in storage:", currentAccount.credits_available);
            
            // Send message to popup to update credits display
            chrome.runtime.sendMessage({
              action: "updateCredits",
              credits: data.credits_available
            }).catch(() => {
              console.log("Popup not open, skipping credit update message");
            });
          }
        } else {
          console.log("No credits_available in API response");
        }
      } catch (error) {
        console.error("Alt text generation failed:", error);
        // Update the loading state with error message
        updateAltTextResult(tab.id, "Error generating alt text: " + error.message);
      }
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "runAltText" && message.imageUrl) {
    console.log("Received runAltText message with imageUrl:", message.imageUrl);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        console.log("Running alt text injection for tab:", tabs[0].id);
        runAltTextInjection(tabs[0].id, message.imageUrl, "This is a generated alt description.");
      }
    });
  }
});

function updateAltTextResult(tabId, altText) {
  console.log("Updating alt text result for tab:", tabId, "with text:", altText);
  chrome.scripting.executeScript({
    target: { tabId },
    args: [altText],
    func: (altText) => {
      console.log("Content script: Updating alt text result with:", altText);
      const loader = document.getElementById("alt-loader");
      if (loader) {
        const textSpan = loader.querySelector("span");
        
        if (textSpan) {
          // Create close button
          const closeBtn = document.createElement("button");
          closeBtn.innerText = "✖";
          Object.assign(closeBtn.style, {
            background: "transparent",
            border: "none",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer",
            outline: "none",
            marginRight: "16px",
          });
          closeBtn.addEventListener("click", () => {
            loader.remove();
          });

          // Create copy button
          const copyBtn = document.createElement("button");
          copyBtn.innerText = "📋";
          Object.assign(copyBtn.style, {
            background: "transparent",
            border: "none",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer",
            marginLeft: "16px",
            outline: "none",
          });
          copyBtn.disabled = false;

          copyBtn.addEventListener("click", () => {
            const textToCopy = textSpan.innerText.replace(/^✅ Alt text: /, "");
            navigator.clipboard.writeText(textToCopy);
            copyBtn.innerText = "✔️";
            setTimeout(() => (copyBtn.innerText = "📋"), 1000);
          });

          // Update text content
          textSpan.innerText = "✅ Alt text: " + altText;
          
          // Clear loader and rebuild with all elements
          loader.innerHTML = "";
          loader.appendChild(closeBtn);
          loader.appendChild(textSpan);
          loader.appendChild(copyBtn);
        }
      }
    }
  });
}

function runAltTextInjection(tabId, imageUrl, altText = null) {
  console.log("Running alt text injection for tab:", tabId, "with altText:", altText);
  chrome.scripting.executeScript({
    target: { tabId },
    args: [imageUrl, altText],
    func: (imageUrl, altText) => {
      console.log("Content script: Creating loader with imageUrl:", imageUrl, "altText:", altText);
      // Remove any existing loader first
      const existingLoader = document.getElementById("alt-loader");
      if (existingLoader) {
        existingLoader.remove();
      }

      const loader = document.createElement("div");
      loader.id = "alt-loader";
      Object.assign(loader.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        backgroundColor: "#333",
        color: "white",
        padding: "12px 16px",
        borderRadius: "8px",
        fontFamily: "sans-serif",
        fontSize: "14px",
        zIndex: 9999,
        boxShadow: "0 0 10px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        minWidth: "200px",
      });

      const textSpan = document.createElement("span");
      Object.assign(textSpan.style, {
        flex: "1",
        textAlign: "center",
        margin: "0 8px",
        whiteSpace: "pre-line",
        overflow: "hidden",
      });

      const closeBtn = document.createElement("button");
      closeBtn.innerText = "✖";
      Object.assign(closeBtn.style, {
        background: "transparent",
        border: "none",
        color: "#fff",
        fontWeight: "bold",
        fontSize: "16px",
        cursor: "pointer",
        outline: "none",
        marginRight: "16px",
      });
      closeBtn.addEventListener("click", () => {
        loader.remove();
      });

      const copyBtn = document.createElement("button");
      copyBtn.innerText = "📋";
      Object.assign(copyBtn.style, {
        background: "transparent",
        border: "none",
        color: "#fff",
        fontWeight: "bold",
        fontSize: "16px",
        cursor: "pointer",
        marginLeft: "16px",
        outline: "none",
      });
      copyBtn.disabled = true;

      copyBtn.addEventListener("click", () => {
        const textToCopy = textSpan.innerText.replace(/^✅ Alt text: /, "");
        navigator.clipboard.writeText(textToCopy);
        copyBtn.innerText = "✔️";
        setTimeout(() => (copyBtn.innerText = "📋"), 1000);
      });

      // Show loading state or final result
      if (altText) {
        // Show final result immediately (for fallback cases)
        textSpan.innerText = "✅ Alt text: " + altText;
        copyBtn.disabled = false;
        loader.appendChild(closeBtn);
        loader.appendChild(textSpan);
        loader.appendChild(copyBtn);
      } else {
        // Show loading state
        textSpan.innerText = "⏳ Generating alt text...";
        loader.appendChild(textSpan);
      }

      document.body.appendChild(loader);
    },
  });
}
