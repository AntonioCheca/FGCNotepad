import {copyFileSync, existsSync, mkdirSync, readdirSync, rmSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const coreSourceDir = join(rootDir, "node_modules", "@ffmpeg", "core", "dist", "esm");
const ffmpegSourceDir = join(rootDir, "node_modules", "@ffmpeg", "ffmpeg", "dist", "esm");
const targetDir = join(rootDir, "public", "ffmpeg-core");
const coreFiles = ["ffmpeg-core.js", "ffmpeg-core.wasm"];
const workerFiles = ["worker.js", "const.js", "errors.js"];

if (!existsSync(coreSourceDir)) {
    throw new Error("@ffmpeg/core assets were not found. Run npm install from frontend/.");
}

if (!existsSync(ffmpegSourceDir)) {
    throw new Error("@ffmpeg/ffmpeg worker assets were not found. Run npm install from frontend/.");
}

mkdirSync(targetDir, {recursive: true});

for (const entry of readdirSync(targetDir)) {
    if (entry.startsWith("ffmpeg-core.") || workerFiles.includes(entry)) {
        rmSync(join(targetDir, entry), {force: true});
    }
}

for (const file of coreFiles) {
    const source = join(coreSourceDir, file);
    if (!existsSync(source)) {
        throw new Error(`Missing ffmpeg asset: ${source}`);
    }
    copyFileSync(source, join(targetDir, file));
}

for (const file of workerFiles) {
    const source = join(ffmpegSourceDir, file);
    if (!existsSync(source)) {
        throw new Error(`Missing ffmpeg asset: ${source}`);
    }
    copyFileSync(source, join(targetDir, file));
}
