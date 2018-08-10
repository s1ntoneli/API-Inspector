chrome.webRequest.onCompleted.addListener(function(details) {
    console.log("url: " + details.url);
    var xhr = new XMLHttpRequest();
    xhr.open("GET", details.url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            // console.log("xhr result: " + xhr.responseText);
            if (isJson(xhr.responseText + ")")) {
                console.log("is Json");
            } else {
                console.log("not Json");
            }
        }
    }
    xhr.send();
},
{
    urls: ["<all_urls>"],
    types: ["xmlhttprequest"]
}
//["responseHeaders"]
)

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
