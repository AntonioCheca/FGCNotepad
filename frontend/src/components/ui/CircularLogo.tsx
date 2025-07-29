import { Box } from "@mui/material";

interface CircularLogoProps {
    size?: 'small' | 'medium' | 'large';
}

const sizeMap = {
    small: { width: 48, height: 48 },
    medium: { width: 64, height: 64 },
    large: { width: 96, height: 96 }
};

export default function CircularLogo({ size = 'medium' }: CircularLogoProps) {
    const dimensions = sizeMap[size];

    return (
        <Box
            sx={{
                width: dimensions.width,
                height: dimensions.height,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: size === 'small' ? '14px' : size === 'medium' ? '16px' : '20px',
                border: '3px solid',
                borderColor: 'primary.light',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                mx: 'auto',
                '&:hover': {
                    transform: 'scale(1.05)',
                    borderColor: 'primary.dark',
                }
            }}
        >
            {/* Placeholder for your circular logo */}
            FGT
        </Box>
    );
}
