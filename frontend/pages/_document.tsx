import {Head, Html, Main, NextScript} from "next/document";
import {THEME_MODE_PRELOAD_SCRIPT} from "@/src/context/themeModeScript";

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                {/* Runs before first paint so the page never flashes the browser's default background. */}
                <script dangerouslySetInnerHTML={{__html: THEME_MODE_PRELOAD_SCRIPT}}/>
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
