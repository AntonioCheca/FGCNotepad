import { Box } from "@mui/material";
import Image from "next/image";

interface LogoProps {
    size?: 'small' | 'medium' | 'large';
    variant?: 'simple' | 'complete';
    theme?: 'color' | 'monochrome';
    background?: 'positive' | 'negative';
}

const sizeMap = {
    small: { width: 48, height: 48 },
    medium: { width: 64, height: 64 },
    large: { width: 96, height: 96 }
};

export default function Logo({
                                 size = 'medium',
                                 variant = 'simple',
                                 theme = 'color',
                                 background = 'positive'
                             }: LogoProps) {
    const dimensions = sizeMap[size];

    // Build the logo filename based on props
    const logoName = `fgt-${variant}-${theme}-${background === 'positive' ? 'pos' : 'neg'}.svg`;

    return (
        <Box
            sx={{
                width: dimensions.width,
                height: dimensions.height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'scale(1.05)',
                }
            }}
        >
            <Image
                src={`/logos/${logoName}`}
                alt="Fighting Game Theory Logo"
                width={dimensions.width}
                height={dimensions.height}
                style={{
                    objectFit: 'contain',
                }}
            />
        </Box>
    );
}
