document.addEventListener('DOMContentLoaded', () => {
    console.log('Demo installation screen loaded');
    
    const video = document.getElementById('demoVideo');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const closeBtn = document.getElementById('closeBtn');
    
    // Handle video loading
    if (video) {
        video.addEventListener('loadeddata', () => {
            console.log('Demo video loaded successfully');
        });
        
        video.addEventListener('error', (e) => {
            console.log('Video failed to load, showing fallback content');
            // Video fallback is already in HTML, so nothing extra needed
        });
    }
    
    // Get Started button - opens extension popup
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            console.log('User clicked Get Started');
            
            // Close current tab and try to open extension popup
            chrome.tabs.getCurrent((tab) => {
                if (tab) {
                    // Close the demo tab
                    chrome.tabs.remove(tab.id);
                    
                    // Note: We can't directly open popup from content script,
                    // but user can click the extension icon after this
                }
            });
        });
    }
    
    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            console.log('User closed demo');
            
            chrome.tabs.getCurrent((tab) => {
                if (tab) {
                    chrome.tabs.remove(tab.id);
                }
            });
        });
    }
    
    // Track demo engagement for analytics (optional)
    let startTime = Date.now();
    let userInteracted = false;
    
    // Track if user interacts with the page
    document.addEventListener('click', () => {
        if (!userInteracted) {
            userInteracted = true;
            console.log('User interacted with demo page');
        }
    });
    
    // Track time spent when leaving
    window.addEventListener('beforeunload', () => {
        const timeSpent = Date.now() - startTime;
        console.log(`Demo page engagement: ${timeSpent}ms, interacted: ${userInteracted}`);
        
        // Store analytics data (optional)
        chrome.storage.local.set({
            demoViewed: true,
            demoTimeSpent: timeSpent,
            demoInteracted: userInteracted,
            demoViewedAt: new Date().toISOString()
        });
    });
});
