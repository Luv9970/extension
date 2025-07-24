document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("main-container");

  const { apiKey, account, selectedLanguage } = await chrome.storage.local.get(["apiKey", "account", "selectedLanguage"]);

  if (apiKey && account) {
    renderVerifiedUI(container, account, selectedLanguage || "en");
    
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
      renderVerifiedUI(container, userDetails, "en"); // Default to English

      // Auto-close after 3s (optional)
      setTimeout(() => window.close(), 3000);

    } catch (err) {
      console.error("Verification error:", err);
      status.textContent = "❌ Unable to verify the key.";
      status.style.color = "red";
    }
  });
});

const languageMapping = {
    "Abkhaz": "ab",
    "Acehnese": "ace",
    "Acholi": "ach",
    "Afrikaans": "af",
    "Albanian": "sq",
    "Alur": "alz",
    "Amharic": "am",
    "Arabic": "ar",
    "Armenian": "hy",
    "Assamese": "as",
    "Awadhi": "awa",
    "Aymara": "ay",
    "Azerbaijani": "az",
    "Balinese": "ban",
    "Bambara": "bm",
    "Bashkir": "ba",
    "Basque": "eu",
    "Batak Karo": "btx",
    "Batak Simalungun": "bts",
    "Batak Toba": "bbc",
    "Belarusian": "be",
    "Bemba": "bem",
    "Bengali": "bn",
    "Betawi": "bew",
    "Bhojpuri": "bho",
    "Bikol": "bik",
    "Bosnian": "bs",
    "Breton": "br",
    "Bulgarian": "bg",
    "Buryat": "bua",
    "Cantonese": "yue",
    "Catalan": "ca",
    "Cebuano": "ceb",
    "Chichewa (Nyanja)": "ny",
    "Chinese (Simplified)": "zh-CN",
    "Chinese (Traditional)": "zh-TW",
    "Chuvash": "cv",
    "Corsican": "co",
    "Crimean Tatar": "crh",
    "Croatian": "hr",
    "Czech": "cs",
    "Danish": "da",
    "Dinka": "din",
    "Divehi": "dv",
    "Dogri": "doi",
    "Dombe": "dov",
    "Dutch": "nl",
    "Dzongkha": "dz",
    "English": "en",
    "Esperanto": "eo",
    "Estonian": "et",
    "Ewe": "ee",
    "Fijian": "fj",
    "Filipino (Tagalog)": "fil",
    "Finnish": "fi",
    "French": "fr",
    "French (French)": "fr-FR",
    "French (Canadian)": "fr-CA",
    "Frisian": "fy",
    "Fulfulde": "ff",
    "Ga": "gaa",
    "Galician": "gl",
    "Ganda (Luganda)": "lg",
    "Georgian": "ka",
    "German": "de",
    "Greek": "el",
    "Guarani": "gn",
    "Gujarati": "gu",
    "Haitian Creole": "ht",
    "Hakha Chin": "cnh",
    "Hausa": "ha",
    "Hawaiian": "haw",
    "Hebrew": "he",
    "Hiligaynon": "hil",
    "Hindi": "hi",
    "Hmong": "hmn",
    "Hungarian": "hu",
    "Hunsrik": "hrx",
    "Icelandic": "is",
    "Igbo": "ig",
    "Iloko": "ilo",
    "Indonesian": "id",
    "Irish": "ga",
    "Italian": "it",
    "Japanese": "ja",
    "Javanese": "jv",
    "Kannada": "kn",
    "Kapampangan": "pam",
    "Kazakh": "kk",
    "Khmer": "km",
    "Kiga": "cgg",
    "Kinyarwanda": "rw",
    "Kituba": "ktu",
    "Konkani": "gom",
    "Korean": "ko",
    "Krio": "kri",
    "Kurdish (Kurmanji)": "ku",
    "Kurdish (Sorani)": "ckb",
    "Kyrgyz": "ky",
    "Lao": "lo",
    "Latgalian": "ltg",
    "Latin": "la",
    "Latvian": "lv",
    "Ligurian": "lij",
    "Limburgan": "li",
    "Lingala": "ln",
    "Lithuanian": "lt",
    "Lombard": "lmo",
    "Luo": "luo",
    "Luxembourgish": "lb",
    "Macedonian": "mk",
    "Maithili": "mai",
    "Makassar": "mak",
    "Malagasy": "mg",
    "Malay": "ms",
    "Malay (Jawi)": "ms-Arab",
    "Malayalam": "ml",
    "Maltese": "mt",
    "Maori": "mi",
    "Marathi": "mr",
    "Meadow Mari": "chm",
    "Meiteilon (Manipuri)": "mni-Mtei",
    "Minang": "min",
    "Mizo": "lus",
    "Mongolian": "mn",
    "Myanmar (Burmese)": "my",
    "Ndebele (South)": "nr",
    "Nepalbhasa (Newari)": "new",
    "Nepali": "ne",
    "Northern Sotho (Sepedi)": "nso",
    "Norwegian": "no",
    "Nuer": "nus",
    "Occitan": "oc",
    "Odia (Oriya)": "or",
    "Oromo": "om",
    "Pangasinan": "pag",
    "Papiamento": "pap",
    "Pashto": "ps",
    "Persian": "fa",
    "Polish": "pl",
    "Portuguese": "pt",
    "Portuguese (Portugal)": "pt-PT",
    "Portuguese (Brazil)": "pt-BR",
    "Punjabi": "pa",
    "Punjabi (Shahmukhi)": "pa-Arab",
    "Quechua": "qu",
    "Romani": "rom",
    "Romanian": "ro",
    "Rundi": "rn",
    "Russian": "ru",
    "Samoan": "sm",
    "Sango": "sg",
    "Sanskrit": "sa",
    "Scots Gaelic": "gd",
    "Serbian": "sr",
    "Sesotho": "st",
    "Seychellois Creole": "crs",
    "Shan": "shn",
    "Shona": "sn",
    "Sicilian": "scn",
    "Silesian": "szl",
    "Sindhi": "sd",
    "Sinhala (Sinhalese)": "si",
    "Slovak": "sk",
    "Slovenian": "sl",
    "Somali": "so",
    "Spanish": "es",
    "Sundanese": "su",
    "Swahili": "sw",
    "Swati": "ss",
    "Swedish": "sv",
    "Tajik": "tg",
    "Tamil": "ta",
    "Tatar": "tt",
    "Telugu": "te",
    "Tetum": "tet",
    "Thai": "th",
    "Tigrinya": "ti",
    "Tsonga": "ts",
    "Tswana": "tn",
    "Turkish": "tr",
    "Turkmen": "tk",
    "Twi (Akan)": "ak",
    "Ukrainian": "uk",
    "Urdu": "ur",
    "Uyghur": "ug",
    "Uzbek": "uz",
    "Vietnamese": "vi",
    "Welsh": "cy",
    "Xhosa": "xh",
    "Yiddish": "yi",
    "Yoruba": "yo",
    "Yucatec Maya": "yua",
    "Zulu": "zu"
};

function renderVerifiedUI(container, userDetails, currentLanguage = "en") {
  const initials = userDetails.user_name
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase();

  // Find the language name from the code
  const currentLanguageName = Object.keys(languageMapping).find(
    key => languageMapping[key] === currentLanguage
  ) || "English";

  // Generate language options
  const languageOptions = Object.keys(languageMapping)
    .sort()
    .map(langName => 
      `<option value="${languageMapping[langName]}" ${languageMapping[langName] === currentLanguage ? 'selected' : ''}>${langName}</option>`
    ).join('');

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
        <div class="section-title">Language Settings</div>
        <div class="language-group" style="display: flex; align-items: center; gap: 8px;">
            <select id="languageSelect" class="language-select" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                ${languageOptions}
            </select>
            <button id="saveLanguageBtn" class="save-btn" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">Save</button>
        </div>
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

  // Handle language save button
  document.getElementById("saveLanguageBtn").addEventListener("click", async () => {
    const selectedLanguage = document.getElementById("languageSelect").value;
    await chrome.storage.local.set({ selectedLanguage });
    
    const saveBtn = document.getElementById("saveLanguageBtn");
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "Saved!";
    saveBtn.style.background = "#2196F3";
    
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.style.background = "#4CAF50";
    }, 1500);
    
    console.log("Language saved:", selectedLanguage);
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
