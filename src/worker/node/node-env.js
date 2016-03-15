

import { VirtualFs } from "../vfs/virtual-fs";
import { HttpDirectory } from "../vfs/http-fs";
import make_binding from "./binding";
import * as Path from "../vfs/path";
import { NodeContainer, Module  } from "./node-container";

const INITIAL_FOLDER_NAME = "home";
const INITIAL_FOLDER = "/" + INITIAL_FOLDER_NAME;
const EXECUTABLE = "/bin/node";

const INIT_PROGRAM = `
  var scope = self;
  scope.global = scope;
  scope.Buffer = require('buffer').Buffer;
  var Process = require('browser-process');
  var binding = require('binding');
  var process = new Process(binding);
  scope.process = process;
  // browser-process-init depends on streams transitively
  // but streams depend on process.nextTick
  // so initialization of process had to be splitted
  // to fulfill the dependency graph
  require('browser-process-init')(process);
`;

function initialize() {
    const vfs = new VirtualFs();
    const httpDir = new HttpDirectory("/node_modules", "node_modules");
    vfs.root.setItem(httpDir);
    const moduleDir = new HttpDirectory("/modules", "modules");
    vfs.root.setItem(moduleDir);
    vfs.createDirectory(vfs.root, INITIAL_FOLDER_NAME);

    const binding = make_binding(vfs, EXECUTABLE, INITIAL_FOLDER);
    const module_list = [new Module('binding', null, binding)];

    const M = "/modules/";
    const R = "/node_modules/";
    const redirects = {

        "fs": M+"fs",
        "child_process": M+"child_process",
        "node-vfs": M+"node-vfs",
        "browser-process": M+"process",
        "browser-process-init": M+"process-init",

        "assert": R+"assert",
        "buffer": R+"buffer",
        "console": R+"console-browserify",
        "constants": R+"constants-browserify",
        "crypto": R+"crypto-browserify",
        "domain": R+"domain-browser",
        "events": R+"events",
        "http": R+"http-browserify",
        "https": R+"https-browserify",
        "net": R+"net-browserify",
        "os": R+"os-browserify",
        "path": R+"path-browserify",
        "punycode": R+"punycode",
        "querystring": R+"querystring",
        "stream": R+"stream-browserify",
        "string_decoder": R+"string_decoder",
        "timers": R+"timers-browserify",
        "tls": R+"tls-browserify",
        "tty": R+"tty-browserify",
        "url": R+"url",
        "util": R+"util",
        "vm": R+"vm-browserify",
        "zlib": R+"browserify-zlib",

        "_stream_transform": R+"readable-stream/lib/_stream_transform.js"
    };


    const container = new NodeContainer(vfs, INITIAL_FOLDER, module_list, redirects);

    // setup node globals and process
    container.eval_lines(INIT_PROGRAM);

    return container;
}

export default initialize;
