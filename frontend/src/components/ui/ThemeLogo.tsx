import {useMode} from "@/src/context/ThemeContext";
import Image from "next/image";

type ThemeLogoProps = {
    className?: string;
    collapsed?: boolean;
};

export default function ThemeLogo({className, collapsed = false}: ThemeLogoProps) {
    const {mode} = useMode();

    const src = collapsed
        ? (mode === "light" ? "/logos/favicon-color-pos.svg" : "/logos/favicon-color-neg.svg")
        : (mode === "light" ? "/logos/fgt-simp-color-pos.svg" : "/logos/fgt-simp-color-neg.svg");

    const width = collapsed ? 40 : 172;
    const height = collapsed ? 40 : 51;

    return (
        <Image
            src={src}
            alt="FG Theory"
            className={className}
            width={width}
            height={height}
            priority
            style={{
                display: "block",
                margin: "0 auto",
                maxWidth: "100%",
                width,
                height,
            }}
            sizes={`${width}px`}
        />
    );
}
