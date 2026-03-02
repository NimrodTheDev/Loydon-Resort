import { spawn } from "child_process";
import gulp from "gulp";

let child;

function runServer() {
    if (child) {
        child.kill();
    }
    child = spawn("bun", ["index.ts"], {
        stdio: "inherit",
        shell: true,
    });
    child.on("close", (code) => {
        if (code !== 0) {
            console.error(`Process exited with code ${code}`);
        }
    });
}

export default function () {
    runServer();
    return gulp.watch(
        ["**/*.ts", "**/*.ejs", "**/*.js", "**/*.css", "**/*.json"],
        { ignored: ["node_modules/**", "bun.lock*"] },
        runServer
    );
};

