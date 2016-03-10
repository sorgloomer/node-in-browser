
import buffer from "buffer";
import path from "path";
import http from "http";
import https from "https";

import { VirtualNodeFs } from "../vfs/node-vfs";
import { HttpDirectory } from "../vfs/http-fs";

import { NodeContainer, Module  }from "./node-container";

export default function() {
    // process.chdir("/user");
    const fs = new VirtualNodeFs(process);
    const common = "node_modules";
    const httpDir = new HttpDirectory("/" + common, common);
    fs._vfs.root.setItem(httpDir);
    return new NodeContainer(fs, [
        new Module('fs', null, fs),
        new Module('buffer', null, buffer),
        new Module('path', null, path),
        new Module('http', null, http),
        new Module('https', null, https)
    ]);
};
