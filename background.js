// chrome.runtime.onInstalled.addListener(() => {
//   chrome.contextMenus.create({
//     id: "generateAltText",
//     title: "Generate Alt text",
//     contexts: ["image"],
//   });
// });

// chrome.contextMenus.onClicked.addListener(async (info, tab) => {
//   if (info.menuItemId === "generateAltText") {
//     const { apiKey, account } = await chrome.storage.local.get(["apiKey", "account"]);

//     await chrome.storage.local.set({ pendingImageUrl: info.srcUrl });

//     // If key is not there open popup
//     if (!apiKey) {
//       chrome.action.openPopup();
//       return;
//     }

//     // Key exists → proceed to inject script and show alt text
//     chrome.scripting.executeScript({
//       target: { tabId: tab.id },
//       args: [info.srcUrl],
//       func: (imageUrl) => {
//         // Same logic here as your alt-text UI generation
//         const loader = document.createElement("div");
//         loader.id = "alt-loader";
//         Object.assign(loader.style, {
//           position: "fixed",
//           top: "20px",
//           right: "20px",
//           backgroundColor: "#333",
//           color: "white",
//           padding: "12px 16px",
//           borderRadius: "8px",
//           fontFamily: "sans-serif",
//           fontSize: "14px",
//           zIndex: 9999,
//           boxShadow: "0 0 10px rgba(0,0,0,0.3)",
//           display: "flex",
//           alignItems: "center",
//           minWidth: "200px",
//         });

//         const textSpan = document.createElement("span");
//         textSpan.innerText = "⏳ Generating alt text...";
//         Object.assign(textSpan.style, {
//           flex: "1",
//           textAlign: "center",
//           margin: "0 8px",
//           whiteSpace: "pre-line",
//           overflow: "hidden",
//         });

//         const closeBtn = document.createElement("button");
//         closeBtn.innerText = "✖";
//         Object.assign(closeBtn.style, {
//           background: "transparent",
//           border: "none",
//           color: "#fff",
//           fontWeight: "bold",
//           fontSize: "16px",
//           cursor: "pointer",
//           outline: "none",
//           marginRight: "16px",
//         });
//         closeBtn.title = "Close";
//         closeBtn.addEventListener("click", () => {
//           loader.remove();
//         });

//         const copyBtn = document.createElement("button");
//         copyBtn.innerText = "📋";
//         Object.assign(copyBtn.style, {
//           background: "transparent",
//           border: "none",
//           color: "#fff",
//           fontWeight: "bold",
//           fontSize: "16px",
//           cursor: "pointer",
//           marginLeft: "16px",
//           outline: "none",
//         });
//         copyBtn.title = "Copy alt text";
//         copyBtn.disabled = true;

//         copyBtn.addEventListener("click", () => {
//           const textToCopy = textSpan.innerText.replace(/^✅ Alt text: /, "");
//           navigator.clipboard.writeText(textToCopy).then(
//             () => {
//               copyBtn.innerText = "✔️";
//               setTimeout(() => {
//                 copyBtn.innerText = "📋";
//               }, 1000);
//             },
//             () => {
//               copyBtn.innerText = "❌";
//               setTimeout(() => {
//                 copyBtn.innerText = "📋";
//               }, 1000);
//             }
//           );
//         });

//         loader.appendChild(textSpan);
//         document.body.appendChild(loader);

//         setTimeout(() => {
//           const altText = "This is a generated alt description.";
//           textSpan.innerText = "✅ Alt text: " + altText;
//           copyBtn.disabled = false;
//           loader.innerHTML = "";
//           loader.appendChild(closeBtn);
//           loader.appendChild(textSpan);
//           loader.appendChild(copyBtn);
//         }, 2000);
//       },
//     });
//   }
// });






chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "generateAltText",
    title: "Generate Alt text",
    contexts: ["image"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "generateAltText") {
    const { apiKey } = await chrome.storage.local.get(["apiKey"]);

    // Save image URL temporarily
    await chrome.storage.local.set({ pendingImageUrl: info.srcUrl });

    if (!apiKey) {
      chrome.action.openPopup();
    } else {
      runAltTextInjection(tab.id, info.srcUrl);
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "runAltText" && message.imageUrl) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        runAltTextInjection(tabs[0].id, message.imageUrl);
      }
    });
  }
});

function runAltTextInjection(tabId, imageUrl) {
  chrome.scripting.executeScript({
    target: { tabId },
    args: [imageUrl],
    func: (imageUrl) => {
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
      textSpan.innerText = "⏳ Generating alt text...";
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

      loader.appendChild(textSpan);
      document.body.appendChild(loader);

      setTimeout(() => {
        const altText = "This is a generated alt description.";
        textSpan.innerText = "✅ Alt text: " + altText;
        copyBtn.disabled = false;
        loader.innerHTML = "";
        loader.appendChild(closeBtn);
        loader.appendChild(textSpan);
        loader.appendChild(copyBtn);
      }, 2000);
    },
  });
}




