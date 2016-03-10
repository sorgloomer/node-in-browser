
import assert from "assert";
import buffer from "buffer";
import console from "console";
import constants from "constants";
import crypto from "crypto";
import domain from "domain";
import events from "events";
import http from "http";
import https from "https";
import os from "os";
import path from "path";
import punycode from "punycode";
import querystring from "querystring";
import stream from "stream";
import string_decoder from "string_decoder";
import timers from "timers";
import tty from "tty";
import url from "url";
import util from "util";
import vm from "vm";
import zlib from "zlib";

import child_process from "../modules/child_process";

import { VirtualNodeFs } from "../vfs/node-vfs";
import { HttpDirectory } from "../vfs/http-fs";
import { NodeContainer, Module  }from "./node-container";

// Hack browserify's objects into global scope
self.global = self;
self.process = process;
self.Buffer = Buffer;

// extend process with properties missing from the browserify process
process.stdin = new stream.Readable();
process.stdout = ostream("stdout:");
process.stderr = ostream("stderr:");
process.argv = ["node/node"];
function ostream(prefix) {
    var stream = new stream.Writable();
    stream._write = (chunk, enncoding) => { console.log(prefix + chunk.toString(enncoding || 'utf-8')); };
    return stream;
}


export default function() {
    // process.chdir("/user");
    const fs = new VirtualNodeFs(process);
    const common = "node_modules";
    const httpDir = new HttpDirectory("/" + common, common);
    fs._vfs.root.setItem(httpDir);

    const moduleList = [
        ["assert", assert],
        ["buffer", buffer],
        ["console", console],
        ["constants", constants],
        ["crypto", crypto],
        ["domain", domain],
        ["events", events],
        ["http", http],
        ["https", https],
        ["os", os],
        ["path", path],
        ["punycode", punycode],
        ["querystring", querystring],
        ["stream", stream],
        ["string_decoder", string_decoder],
        ["timers", timers],
        ["tty", tty],
        ["url", url],
        ["util", util],
        ["vm", vm],
        ["zlib", zlib],

        ["child_process", child_process],

        ['fs', fs]
    ].map(([name, exp]) => new Module(name, null, exp));

    return new NodeContainer(fs, moduleList);
};
