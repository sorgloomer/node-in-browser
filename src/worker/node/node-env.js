
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
import * as Path from "../vfs/path";
import { NodeContainer, Module  }from "./node-container";

// Hack browserify's objects into global scope
self.global = self;
self.process = process;
self.Buffer = Buffer;

const INITIAL_FOLDER_NAME = "home";
const INITIAL_FOLDER = "/" + INITIAL_FOLDER_NAME;
const EXECUTABLE = "/bin/node";

function patch_process() {
    const _process = process;
    var cwd = INITIAL_FOLDER;
    _process.stdin = new stream.Readable();
    _process.stdout = ostream("stdout:");
    _process.stderr = ostream("stderr:");
    _process.argv = [EXECUTABLE];
    _process.cwd = () => cwd;
    _process.chdir = d => {
        cwd = Path.resolve(cwd, d);
    };
}

function ostream(prefix) {
    var result = new stream.Writable();
    result._write = function(chunk, enncoding) {
        console.log(prefix + chunk.toString(enncoding || 'utf-8'));
    };
    return result;
}

function initialize() {
    patch_process();

    const fs = new VirtualNodeFs(process);
    const httpDir = new HttpDirectory("/node_modules", "node_modules");
    fs._vfs.root.setItem(httpDir);
    fs._vfs.createDirectory(fs._vfs.root, INITIAL_FOLDER_NAME);

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

    return new NodeContainer(fs, moduleList, INITIAL_FOLDER);
}

export default initialize;
