

import { VirtualNodeFs } from "../vfs/node-vfs";
import { VirtualFs } from "../vfs/virtual-fs";
import { HttpDirectory } from "../vfs/http-fs";
import * as Path from "../vfs/path";
import { NodeContainer, Module  }from "./node-container";

const INITIAL_FOLDER_NAME = "home";
const INITIAL_FOLDER = "/" + INITIAL_FOLDER_NAME;
const EXECUTABLE = "/bin/node";

function patch_process(container) {
    const stream = container.require("stream");
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
    result._write = function(chunk, encoding) {
        console.log(prefix + chunk.toString(encoding || 'utf-8'));
    };
    return result;
}

function init_globals(container) {
    // Hack browserify's objects into global scope
    self.Buffer = container.require("stream").Buffer;
    self.global = self;
    self.process = process;
}

function initialize() {
    const vfs = new VirtualFs(process);
    const httpDir = new HttpDirectory("/node_modules", "node_modules");
    vfs.root.setItem(httpDir);
    vfs.createDirectory(vfs.root, INITIAL_FOLDER_NAME);

    const container_fs = new VirtualNodeFs(process, vfs);
    const module_fs = new VirtualNodeFs(process, vfs);

    const module_list = [
        ["child_process", {}],
        ['fs', module_fs ]
    ].map(([name, exp]) => new Module(name, null, exp));

    const R = "/node_modules/";
    const redirects = {
        "assert": R+"assert",
        "buffer": R+"buffer",
        "console": R+"console-browserify",
        "constants": R+"constants-browserify",
        "crypto": R+"crypto-browserify",
        "domain": R+"domain-browser",
        "events": R+"events",
        "http": R+"http-browserify",
        "https": R+"https-browserify",
        "os": R+"os-browserify",
        "path": R+"path-browserify",
        "punycode": R+"punycode",
        "querystring": R+"querystring",
        "stream": R+"stream-browserify",
        "string_decoder": R+"string_decoder",
        "timers": R+"timers-browserify",
        "tty": R+"tty-browserify",
        "url": R+"url",
        "util": R+"util",
        "vm": R+"vm-browserify",
        "zlib": R+"browserify-zlib"
    };
    const container = new NodeContainer(container_fs, INITIAL_FOLDER, module_list, redirects);

    init_globals(container);
    patch_process(container);
    return container;
}

export default initialize;
