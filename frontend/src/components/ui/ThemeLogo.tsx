import {useMode} from "@/src/context/ThemeContext";
import Image from "next/image";

type ThemeLogoProps = {
    className?: string;
    collapsed?: boolean;
};

export default function ThemeLogo({className, collapsed = false}: ThemeLogoProps) {
    const {mode} = useMode();

    const src = mode === "light"
        ? "/logos/favicon-color-pos.svg"
        : "/logos/favicon-color-neg.svg";

    const baseSizeRem = collapsed ? 2 : 3;
    const baseSizePx = baseSizeRem * 16;

    return (
        <Image
            src={src}
            alt="Logo"
            className={className}
            width={baseSizePx}
            height={baseSizePx * 0.66}
            priority
            style={{
                display: "block",
                margin: "0 auto",
                maxWidth: "100%",
                height: "auto",
            }}
            sizes={`${baseSizeRem}rem`}
        />
    );
}
