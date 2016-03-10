
export function ascii_to_bytes(ascii) {
    const res = new Uint8Array(ascii.length);
    for (var i = 0; i < res.length; i++) {
        res[i] = ascii.charCodeAt(i);
    }
    return res;
}

function utf8_to_bytes(text) {
    const encoder = new TextEncoder("utf-8");
    return encoder.encode(text);
}

export function fetchBytesSync(url) {
    // NOTE: It might not retrieve the exact bytes!!!
    // but this module is usually used to load sources,
    // so as long as the new bytes represent the same text
    // it will work normally
    return utf8_to_bytes(fetchSync(url));
}

export function fetchSync(url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send(null);
    const statusCode = xhr.status;
    if ((statusCode >= 200 && statusCode < 300) || statusCode == 304) {
        return xhr.response;
    } else {
        throw new Error("HTTP " + statusCode + ": " + xhr.response);
    }
}

export function fetchJsonSync(url) {
    return JSON.parse(fetchSync(url));
}
