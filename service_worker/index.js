// import * as JSZip from "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.js";

// console.log(JSZip);

// chrome.webRequest.onBeforeRequest.addListener(function (details) {
//     const url = new URL(details.url).href;
//     console.log("Hello world: ", url);
//     console.log(details);
//     return
// }, {
//     urls: ["*://*.instagram.com/*"]
// }, []);

// self.onmessage = async function(message) {
//     if (message.data.type === 'webRequestCompleted') {
//       const { tabId, requestId, response } = message.data.details;
//       const statusCode = response.status;
//       const responseHeaders = response.headers;
//       const responseData = await response.arrayBuffer();
//       // Do something with the response data
//     }
//   };

//   chrome.webRequest.onCompleted.addListener(
//     function(details) {
//       self.postMessage({ type: 'webRequestCompleted', details });
//     },
//     { urls: ["<all_urls>"] }
//   );

const setDataToStorage = async (key, value) => {
  return await chrome.storage.local.set({ [key]: value });
};

const getDataFromStorage = async (keys) => {
  return await chrome.storage.local.get([...keys]);
};

// const idbStoreManager = {
//     navigation: IndexedDataBase.createStore("IGStoryDownloader", "navStore"),
//     bulk_route_definition: IndexedDataBase.createStore("IGStoryDownloader", "bulkRouteStore"),
//     timeline: IndexedDataBase.createStore("IGStoryDownloader", "timelineStore"),
//     reels_tray: IndexedDataBase.createStore("IGStoryDownloader", "reelsTrayStore"),
//     reels_media: IndexedDataBase.createStore("IGStoryDownloader", "reelsMediaStore"),
// }

const saveDataToIDB = (type, data) => {
  let items = [];
  try {
    switch (type) {
      case "navigation":

      case "bulk_route_definition":

      case "timeline":

      case "reels_tray":
        break;
      case "reels_media":
        items = data.reels_media.map((item, i) => {
          let mediaItems = item.media_ids.reduce((acc, mId, i) => {
            acc[mId] = item.items[i];
            return acc;
          }, {});

          return [item.user.username, mediaItems];
        });
        console.log(items);
        break;
      default:
        break;
    }
  } catch (error) {}

  items.forEach((item) => {
    chrome.storage.local.set({ [item[0]]: item[1] }).then(() => {
      console.log("Value is set");
    });
  });
};

const isFeedTimeline = (url) =>
  /^\/?api\/v1\/feed\/timeline\/?(?:[?&a-zA-Z0-9=%\-_.~])*?$/gs.test(url);
const isReelsTray = (url) =>
  /^\/?api\/v1\/feed\/reels_tray\/?(?:[?&a-zA-Z0-9=%\-_.~])*?$/gs.test(url);
const isReelsMedia = (url) =>
  /^\/?api\/v1\/feed\/reels_media\/?(?:[?&a-zA-Z0-9=%\-_.~])*?$/gs.test(url);

const isNavigation = (url) =>
  /^\/?ajax\/navigation\/?(?:[?&a-zA-Z0-9=%\-_.~])*?$/gs.test(url);
const isBulkRouteDef = (url) =>
  /^\/?ajax\/bulk\-route\-definitions\/?(?:[?&a-zA-Z0-9=%\-_.~])*?$/gs.test(
    url
  );

const urlClassifier = (urlPath) => {
  try {
    urlPath = new URL(urlPath).pathname;
  } catch (error) {}

  if (isFeedTimeline(urlPath)) return "timeline";
  else if (isReelsTray(urlPath)) return "reels_tray";
  else if (isReelsMedia(urlPath)) return "reels_media";
  else if (isNavigation(urlPath)) return "navigation";
  else if (isBulkRouteDef(urlPath)) return "bulk_route_definition";
  else return urlPath;

  // const igDirect = "";
  // https://www.instagram.com/direct/inbox/
  // https://www.instagram.com/direct/new/
  // const igExplore = "";
  // https://www.instagram.com/api/v1/discover/web/explore_grid/
  // const igPost = "";
  // https://www.instagram.com/api/v1/p/C3h768mvZ9L/
  // const igProfilePosts = "";
  // https://www.instagram.com/api/v1/users/web_profile_info/?username=sutharvipin29
  // const igProfileSaved = "";
  // https://www.instagram.com/api/v1/archive/reel/day_shells/?timezone_offset=19800
  // const igProfileFeed = "";
  // const igProfileTagged = "";
  // const igNotification = "";
  // https://www.instagram.com/api/v1/news/inbox/
  // https://www.instagram.com/api/v1/news/inbox_seen/
  // https://www.instagram.com/api/v1/friendships/pending/
  // const isReels = "";
  // https://www.instagram.com/reels/C3eeVclNvX-/
  // const isStories = "";
  // https://www.instagram.com/stories/__kishorechoudhary__kk/3305552273049944984/
  // const isReelsAudio = "";
  // https://www.instagram.com/api/v1/reels/audio/725300973119661/
};

// chrome.webRequest.onCompleted.addListener(function (details) {
//     // console.log(details.url);
//     // saveDataToIDB(urlClassifier(details.url), details);

//     // console.log("Hello world: ", url);
//     // console.log(details);
//     // return
// }, {
//     urls: [
//         "*://*.instagram.com/*",
//         "*://*.cdninstagram.com/*",
//         "*://*.fbcdn.net/*"
//     ]
// }, []);

const convertHeaderStringToObj = (str) => {
  let result = {};
  str
    .split("\r\n")
    .map((item) => item.split(": "))
    .reduce((acc, item) => {
      if (item.length < 2 || item[0].trim() === "" || item[1].trim() === "");
      else acc[item[0]] = item[1];
      return acc;
    }, result);
  return result;
};

const processData = (type, data) => {
  let result = null;
  try {
    switch (type) {
      case "text/html":
        break;
      case "text/javascript":
        result = JSON.parse(data.slice(data.indexOf("{")));
        break;
      case "application/json":
        result = JSON.parse(data.slice(data.indexOf("{")));
        break;
      case "application/x-www-form-urlencoded":
        break;
      default:
        break;
    }
  } catch (err) {
    console.error("Parsing Error: " + type, data);
  } finally {
    return result;
  }
};

const processAndSaveResponse = (data) => {
  const respHeaders = convertHeaderStringToObj(data.responseHeaders || "");
  let contentType = (
    respHeaders["content-type"] || 'text/plain; charset="utf-8"'
  )
    .split(";")
    .shift();
  saveDataToIDB(
    urlClassifier(data.url),
    processData(contentType, data.responseBody)
  );
};

// media_type 1 -> image story

const getMediaDownloadData = (mediaData) => {
  let mediaItems =
    mediaData.video_versions || mediaData.image_versions2?.candidates || [];

  if (mediaItems.length > 0) {
    let index = 0;
    mediaItems.forEach((item, i) => {
      if (
        item.width * item.height >
        mediaItems[index].width * mediaItems[index].height
      )
        index = i;
    });
    console.log(mediaItems[index], mediaData);
    return mediaItems[index];
  } else {
    console.log(mediaData);
    return null;
  }
};

const downlaodMediaItem = (payload) => {
  if (!(navigator.onLine && chrome.downloads)) return;
  chrome.downloads.download(payload);
};

const downloadSingleMediaItem = (mediaData) => {
  if (!mediaData) return;
  let mediaDownloadData = getMediaDownloadData(resp[message.payload.media_id]);
  if (!mediaDownloadData) return;
  downlaodMediaItem({
    url: mediaDownloadData.url,
    filename: `${message.payload.username}_${message.payload.media_id}_${
      mediaDownloadData.width
    }X${mediaDownloadData.height}${
      "." +
      (mediaData.media_type === 1
        ? "jpg"
        : mediaData.media_type === 2
        ? "mp4"
        : "")
    }`,
  });
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "download_story":
      console.log("download_story", message);
      chrome.storage.local.get([message.payload.username]).then((result) => {
        let resp = result[message.payload.username];
        if (!resp) {
          sendResponse({ error: true, data: "Some error occured!" });
        } else {
          downloadSingleMediaItem(resp[message.payload.media_id]);
        }
      });
      break;
    case "response_received":
      processAndSaveResponse(message.payload);
      break;
    default:
      break;
  }
});
