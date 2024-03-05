const urlStructures = {
    stories: "/stories/{username}/{?initial_media_id}/"
}

const isStoriesRoute = (url) => /^\/?stories\/[a-zA-Z0-9._]{3,}\/[\d]+\/?(?:[?&a-zA-Z0-9=%\-_.~])*?$/gs.test(url);

function parseUrl(urlStruct, urlPath) {
    const urlStructParts = urlStruct.split('/');
    const urlPathParts = urlPath.split('/');
    const result = {};

    for (let i = 0; i < urlStructParts.length; i++) {
        let part = urlStructParts[i];
        if (!part || part.trim() === "" || part[0] !== '{') continue;
        part = part.slice(1, -1);
        if (part.trim() === "") continue;

        let isOptional = part.startsWith('?');
        let key = isOptional ? part.slice(1) : part;

        if (i < urlPathParts.length) {
            result[key] = urlPathParts[i];
        } else if (!isOptional) {
            result[key] = null;
            // throw new Error(`Missing required part: ${key}`);
        }
    }

    return result;
}

let storyDomObserver = null;

const handleLocationChange = (x) => {
    if (isStoriesRoute(window.location.pathname)) {
        if (!storyDomObserver) storyDomObserver = injectDownloadBtn();
    } else {
        if (storyDomObserver) {
            storyDomObserver.disconnect();
            storyDomObserver = null;
        }
    }
}

const dataStore = {
    data: {},
    onClick: null
}

const getStoryHeaderContainer = (data) => {
    if (!data) return null;
    const root = document.querySelector(`[id^="mount_"]`); // root mount element
    let node1 = document.querySelector(`a[href="/${data.username}/"]>img[src]`); // user avatar element
    let node2 = document.querySelector(`svg[aria-label="Menu"]`); // menu element

    if (!(root && node1 && node2)) return null;

    const getDepth = (node) => {
        let depth = 0;
        while (node !== root) {
            node = node.parentElement;
            depth++;
        }
        return depth;
    }

    const depth1 = getDepth(node1);
    const depth2 = getDepth(node2);

    if (depth1 > depth2) {
        for (let i = 0; i < depth1 - depth2; i++) {
            node1 = node1.parentElement;
        }
    } else if (depth2 > depth1) {
        for (let i = 0; i < depth2 - depth1; i++) {
            node2 = node2.parentElement;
        }
    }

    while (node1 !== node2 && node1 !== root && node2 !== root) {
        node1 = node1.parentElement;
        node2 = node2.parentElement;
    }

    return node1;
}

const createStoryDownloadButton = (onclick) => {
    const newElement = document.createElement('button');
    newElement.id = "download_story_btn";
    newElement.innerHTML = `<svg fill="currentColor" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
    viewBox="0 0 29.978 29.978" xml:space="preserve">
<g>
   <path d="M25.462,19.105v6.848H4.515v-6.848H0.489v8.861c0,1.111,0.9,2.012,2.016,2.012h24.967c1.115,0,2.016-0.9,2.016-2.012
       v-8.861H25.462z"/>
   <path d="M14.62,18.426l-5.764-6.965c0,0-0.877-0.828,0.074-0.828s3.248,0,3.248,0s0-0.557,0-1.416c0-2.449,0-6.906,0-8.723
       c0,0-0.129-0.494,0.615-0.494c0.75,0,4.035,0,4.572,0c0.536,0,0.524,0.416,0.524,0.416c0,1.762,0,6.373,0,8.742
       c0,0.768,0,1.266,0,1.266s1.842,0,2.998,0c1.154,0,0.285,0.867,0.285,0.867s-4.904,6.51-5.588,7.193
       C15.092,18.979,14.62,18.426,14.62,18.426z"/>
</g>
</svg>`;
    newElement.style = {
        width: "32px",
        height: "32px",
        color: "inherit"
    };

    newElement.onclick = onclick;
    return newElement;
}

const injectDownloadBtn = () => {
    const observer = new MutationObserver(() => {

        let data = parseUrl(urlStructures.stories, window.location.pathname);
        const headerContainer = getStoryHeaderContainer(data);
        if (headerContainer) {
            if ((data.username && data.username === dataStore.data.username) &&
                (data.initial_media_id && data.initial_media_id === dataStore.data.initial_media_id)) {
                const downloadButton = document.getElementById("download_story_btn");
                if (downloadButton) return;
            } else if (data.username !== dataStore.data.username ||
                data.initial_media_id !== dataStore.data.initial_media_id) {
                const downloadButton = document.getElementById("download_story_btn");
                if (downloadButton) {
                    downloadButton.removeEventListener('click', dataStore.onClick);
                    dataStore.data = data;
                    dataStore.onClick = () => {
                        window.postMessage({
                            type: 'download_story',
                            payload: {
                                username: data.username,
                                media_id: data.initial_media_id
                            }
                        })
                    }
                    downloadButton.addEventListener('click', dataStore.onClick);
                    return;
                }
            }

            if (headerContainer.parentElement) {

                let viewStoryBtn = document.evaluate(
                    `//div[@role='button' and .='View story']`,
                    headerContainer.parentElement.parentElement || document.body,
                    null,
                    XPathResult.ANY_UNORDERED_NODE_TYPE,
                    null
                );

                let warnText = document.evaluate(
                    `//div[contains(., '${data.username}') and contains(., 'will be able to see that you viewed their story')]`,
                    headerContainer.parentElement.parentElement || document.body,
                    null,
                    XPathResult.ANY_UNORDERED_NODE_TYPE,
                    null
                );

                if (viewStoryBtn?.singleNodeValue || warnText?.singleNodeValue) return;

            }

            dataStore.data = data;
            dataStore.onClick = () => {
                window.postMessage({
                    type: 'download_story',
                    payload: {
                        username: data.username,
                        media_id: data.initial_media_id
                    }
                })
            }
            const elem = createStoryDownloadButton(dataStore.onClick);
            headerContainer.insertBefore(elem, headerContainer.children[1] || headerContainer.lastChild);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
}


(function () {
    // adding event listener to the history API
    window.history.pushState = (fn => function pushState() {
        let res = fn.apply(this, arguments);
        window.dispatchEvent(new Event('pushstate'));
        window.dispatchEvent(new Event('locationchange'));
        return res;
    })(window.history.pushState);

    window.history.replaceState = (fn => function replaceState() {
        let res = fn.apply(this, arguments);
        window.dispatchEvent(new Event('replacestate'));
        window.dispatchEvent(new Event('locationchange'));
        return res;
    })(window.history.replaceState);

    window.addEventListener('popstate', () => {
        window.dispatchEvent(new Event('locationchange'));
    });

    window.addEventListener('locationchange', handleLocationChange);

    // cloning the fetch method
    // const originalFetch = window.fetch;
    // window.fetch = function () {
    //     return new Promise((resolve, reject) => {
    //         originalFetch.apply(this, arguments)
    //             .then((response) => {
    //                 if (response) {
                        

    //                     resolve(response);
    //                 } else {
    //                     console.error('Undefined Response!', response);
    //                     reject(response);
    //                 }
    //             })
    //             .catch((error) => {
    //                 console.log(error);
    //                 reject(response);
    //             })
    //     })
    // }

    // cloning the XHR Request
    const XHR = window.XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;
    const setRequestHeader = XHR.setRequestHeader;
    XHR.open = function (method, url) {
        this._method = method;
        this._url = url;
        this._requestHeaders = {};
        this._startTime = (new Date()).toISOString();
        return open.apply(this, arguments);
    };
    XHR.setRequestHeader = function (header, value) {
        this._requestHeaders[header] = value;
        return setRequestHeader.apply(this, arguments);
    };
    XHR.send = function (data) {
        this._requestBody = data;
        this.addEventListener('load', function () {
            this._endTime = (new Date()).toISOString();
            this._responseHeaders = this.getAllResponseHeaders();
            this._responseBody = this.response;
            
            window.postMessage({
                type: "response_received",
                payload: {
                    url: this._url,
                    method: this._method,
                    requestHeaders: this._requestHeaders,
                    // requestBody: this._requestBody,
                    responseHeaders: this._responseHeaders,
                    responseBody: this._responseBody,
                    startTime: this._startTime,
                    endTime: this._endTime,
                }
            });
        });
        return send.apply(this, arguments);
    };



})();