window.addEventListener("message", (e) => {
  const message = e.data;
  if (!message) return;
  switch (message.type) {
    case "download_story":
      chrome.runtime.sendMessage(message);
      break;
    case "response_received":
      chrome.runtime.sendMessage(message);
      break;
    default:
      break;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const messageType = message.type;
  switch (messageType) {
    case "download_story":
      console.log(message);
      break;
    default:
      break;
  }
});
