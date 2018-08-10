var urls = new Map();
var requestUrls = [];

chrome.webRequest.onCompleted.addListener(function(details) {
    var url = details.url;
    console.log("url: " + url);
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);

    if (contains(requestUrls, url)) return;

    requestUrls.push(url);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            // console.log("xhr result: " + xhr.responseText);
            if (isJson(xhr.responseText)) {
                console.log("is Json");
                var urlObj = parseURL(url);
                var key = urlObj.host + urlObj.path;
                if (!urls.has(key)) {
                    // urls.push(urlObj);
                    urls.set(key, urlObj);
                    console.warn("add " + url);

                    notifyPopup(urls);
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
        chrome.browserAction.setBadgeText({text: ""});
    } else {
        chrome.browserAction.setBadgeText({text: urls.size + ""});
    }
}
