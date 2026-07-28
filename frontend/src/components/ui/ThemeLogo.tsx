import Image from "next/image";

type ThemeLogoProps = {
    className?: string;
    collapsed?: boolean;
};

export default function ThemeLogo({className, collapsed = false}: ThemeLogoProps) {
    const src = collapsed ? "/logos/favicon-color-neg.svg" : "/logos/fgt-simp-color-neg.svg";

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
