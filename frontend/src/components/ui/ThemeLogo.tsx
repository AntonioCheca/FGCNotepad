import {useMode} from "@/src/context/ThemeContext";
import Image from "next/image";

export default function ThemeLogo({className}: { className?: string }) {
    const {mode} = useMode();
    const src = mode === "light"
        ? "/logos/favicon-color-pos.svg"
        : "/logos/favicon-color-neg.svg";
    return <Image src={src} alt="Logo" className={className} width={120} height={40}/>;
}
