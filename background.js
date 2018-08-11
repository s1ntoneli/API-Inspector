var apiUrlMap = new Map();
var requestUrlsMap = new Map();

chrome.webRequest.onCompleted.addListener(function(details) {
    var url = details.url;
    var tabId = details.tabId;

    console.log(url);
    if (tabId < 0) return;

    var currentTabList = requestUrlsMap.has(tabId) ? requestUrlsMap.get(tabId) : [];
    if (contains(requestUrlsMap, url)) return;

    currentTabList.push(url);
    requestUrlsMap.set(tabId, currentTabList);

    console.log("url: " + url);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            // console.log("xhr result: " + xhr.responseText);
            if (isJson(xhr.responseText)) {
                console.log("is Json");
                var urlObj = parseURL(url);
                var key = urlObj.host + urlObj.path;

                var currentTabUrlMap = apiUrlMap.has(tabId) ? apiUrlMap.get(tabId) : new Map();
                if (!currentTabUrlMap.has(key)) {
                    // apiUrlMap.push(urlObj);
                    currentTabUrlMap.set(key, urlObj);
                    console.warn("add " + key);

                    apiUrlMap.set(tabId, currentTabUrlMap);
                    notifyPopup(currentTabUrlMap);
                }
            } else {
                console.log("not Json");
            }
        }
    };
    xhr.send();
},
{
    urls: ["<all_urls>"],
    types: ["xmlhttprequest", "script"]
}
//["responseHeaders"]
);

chrome.tabs.onRemoved.addListener(
    function (tabId, removedInfo) {
        // clear tabId from map
        // clear badge
        console.log("removed " + tabId);
        apiUrlMap.delete(tabId);
        requestUrlsMap.delete(tabId);
    }
);

chrome.tabs.onUpdated.addListener(
    function (tabId, changeInfo, tab) {
        console.log("updated " + tabId);
    }
);

chrome.tabs.onActiveChanged.addListener(
    function (tabId, selectInfo) {
        console.log("activeChanged " + tabId);
        notifyPopup(apiUrlMap.get(tabId));
    }
);

chrome.windows.onFocusChanged.addListener(
    function (windowId) {

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs && tabs.length > 0) {
                var tab = tabs[0];
                notifyPopup(apiUrlMap.get(tab.id));
            }
        });
    }
);

function isJson(sData) {
    var isJson = false;
    if (sData) {
        try {
            if (sData.match(/^\s*[\[\{]/)) {
                var oJson = JSON.parse(sData);
                if (typeof oJson === 'object') {
                    isJson = true;
                }
            } else {
                var sTempData = sData.slice(sData.indexOf('(') + 1, sData.lastIndexOf(')'));
                if (typeof JSON.parse(sTempData) === 'object') {
                    isJson = true;
                }
            }
        } catch(e) {}
    }
    return isJson;
}

function contains(urls, url) {
    for (var i in urls) {
        if (urls[i] === url) {
            return true;
        }
    }
    return false;
}

function parseURL(url) {
    var a =  document.createElement('a');
    a.href = url;
    return {
        source: url,
        protocol: a.protocol.replace(':',''),
        host: a.hostname,
        port: a.port,
        query: a.search,
        params: (function(){
            var ret = {},
                seg = a.search.replace(/^\?/,'').split('&'),
                len = seg.length, i = 0, s;
            for (;i<len;i++) {
                if (!seg[i]) { continue; }
                s = seg[i].split('=');
                ret[s[0]] = s[1];
            }
            return ret;
        })(),
        file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
        hash: a.hash.replace('#',''),
        path: a.pathname.replace(/^([^\/])/,'/$1'),
        relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [,''])[1],
        segments: a.pathname.replace(/^\//,'').split('/')
    };
}

function notifyPopup(urls) {
    if (!urls || urls.size === 0) {
        clearBadge()
    } else {
        setBadgeText(urls.size + "");
    }
}

function clearBadge() {
    setBadgeText("")
}

function setBadgeText(text) {
    chrome.browserAction.setBadgeText({text: text});
}

var getCurrentTabUrlMap = function (callback) {
    console.log("getCurrentTabUrlMap");
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        console.log(tabs);
        if (tabs && tabs.length > 0) {
            var tab = tabs[0];
            callback(apiUrlMap.get(tab.id));
        }
    });
}