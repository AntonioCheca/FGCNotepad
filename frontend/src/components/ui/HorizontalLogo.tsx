import { Box } from "@mui/material";
import { AppTypography } from "@/src/components/ui/AppTypography";

interface HorizontalLogoProps {
    size?: 'medium' | 'large';
    showSubtitle?: boolean;
}

export default function HorizontalLogo({ size = 'medium', showSubtitle = true }: HorizontalLogoProps) {
    const isLarge = size === 'large';

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                '&:hover': {
                    transform: 'scale(1.02)',
                }
            }}
        >
            {/* Main Logo Text */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: showSubtitle && isLarge ? 2 : 0
                }}
            >
                {/* Logo Icon */}
                <Box
                    sx={{
                        width: isLarge ? 60 : 40,
                        height: isLarge ? 60 : 40,
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: isLarge ? '20px' : '16px'
                    }}
                >
                    FGT
                </Box>

                {/* Logo Text */}
                <AppTypography
                    variant={isLarge ? 'h2' : 'h4'}
                    sx={{
                        fontWeight: 'bold',
                        color: 'inherit',
                        letterSpacing: '0.05em'
                    }}
                >
                    Fighting Game Theory
                </AppTypography>
            </Box>

            {/* Subtitle (only for large logo) */}
            {showSubtitle && isLarge && (
                <AppTypography
                    variant="h6"
                    sx={{
                        opacity: 0.8,
                        fontWeight: 'normal',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        fontSize: '14px'
                    }}
                >
                    Master the Mathematical Meta
                </AppTypography>
            )}
        </Box>
    );
}
