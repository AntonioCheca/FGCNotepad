import {useMode} from "@/src/context/ThemeContext";
import Image from "next/image";

type ThemeLogoProps = {
    className?: string;
    collapsed?: boolean;
};

export default function ThemeLogo({className, collapsed = false}: ThemeLogoProps) {
    const {mode} = useMode();

    // Use different SVGs or just resize
    const src = mode === "light"
        ? "/logos/favicon-color-pos.svg"
        : "/logos/favicon-color-neg.svg";

    // Use relative units converted to pixels for Image component,
    // fallback to fixed sizes in rem units converted to pixels (e.g., 2.5rem = 40px)
    // Next/Image requires numeric width/height (pixels), so calculate accordingly:
    const baseSizeRem = collapsed ? 2 : 3; // 2rem when collapsed, 3rem expanded
    const baseSizePx = baseSizeRem * 16;  // assuming 16px root font size

    return (
        <Image
            src={src}
            alt="Logo"
            className={className}
            width={baseSizePx}
            height={baseSizePx * 0.66} // maintain aspect ratio ~ 2:3 height to width
            priority
            style={{
                display: "block",
                margin: "0 auto",
                maxWidth: "100%",
                height: "auto",
                transition: "width 0.3s ease, height 0.3s ease",
            }}
            sizes={`${baseSizeRem}rem`} // hint for responsive image sizing
        />
    );
}
