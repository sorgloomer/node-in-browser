
import buffer from "buffer";
import path from "path";
import http from "http";
import https from "https";

import { VirtualNodeFs } from "../vfs/node-vfs";
import { HttpDirectory } from "../vfs/http-fs";

import { NodeContainer  }from "./node-container";

export default function() {
    const fs = new VirtualNodeFs();
    const common = "node_modules";
    const httpDir = new HttpDirectory("/common/" + common, common);
    fs._vfs.root.setItem(httpDir);
    return new NodeContainer(fs, [
        new Module('fs', fs),
        new Module('buffer', buffer),
        new Module('path', path),
        new Module('http', http),
        new Module('https', https)
    ]);
};
