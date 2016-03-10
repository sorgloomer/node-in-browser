
export function ascii_to_bytes(ascii) {
    const res = new Uint8Array(ascii.length);
    for (var i = 0; i < res.length; i++) {
        res[i] = ascii.charCodeAt(i);
    }
    return res;
}

export function fetchBytesSync(url) {
    return ascii_to_bytes(fetchSync(url));
}

export function fetchSync(url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send(null);
    return xhr.response;
}

export function fetchJsonSync(url) {
    return JSON.parse(fetchSync(url));
}
