chrome.action.onClicked.addListener((tab) => {
  if (tab.url.startsWith('https://www.linkedin.com/')) {
    chrome.storage.local.get('savedPosts', ({ savedPosts = [] }) => {
      const post = {
        url: tab.url,
        date: new Date().toISOString(),
        imageUrl: 'https://placeholder.com/300x200'
      };
      
      savedPosts.unshift(post);
      chrome.storage.local.set({ savedPosts });
    });
  }
}); 