import {AppBox} from "@/src/components/ui/AppBox";
import { AppTypography } from "@/src/components/ui/AppTypography";
import Image from "next/image";

export default function HeroSection() {
    return (
        <AppBox
            sx={{
                minHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                color: 'white',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Background Pattern */}
            <AppBox
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.1,
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                }}
            />

            {/* Main Logo */}
            <AppBox sx={{ mb: 4, zIndex: 1 }}>
                <AppBox
                    sx={{
                        transition: 'transform 0.3s ease',
                        '&:hover': {
                            transform: 'scale(1.02)',
                        }
                    }}
                >
                    <Image
                        src="/logos/fgt-completo-color-neg.svg"
                        alt="Fighting Game Theory - Complete Logo"
                        width={400}
                        height={120}
                        style={{
                            objectFit: 'contain',
                            maxWidth: '100%',
                            height: 'auto'
                        }}
                        priority
                    />
                </AppBox>
            </AppBox>

            {/* Welcome Text */}
            <AppBox sx={{ maxWidth: 600, px: 3, zIndex: 1 }}>
                <AppTypography variant="h3" sx={{ mb: 3, fontWeight: 'bold' }}>
                    Master the Meta
                </AppTypography>

                <AppTypography variant="h6" sx={{ mb: 4, opacity: 0.9, lineHeight: 1.6 }}>
                    Dive deep into fighting game theory, analyze frame data, and discover the mathematical
                    foundations behind competitive play.
                </AppTypography>

                <AppBox sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {/* These will be replaced with your custom buttons */}
                    <AppBox
                        component="button"
                        sx={{
                            px: 4,
                            py: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: 2,
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                            }
                        }}
                    >
                        Get Started
                    </AppBox>

                    <AppBox
                        component="button"
                        sx={{
                            px: 4,
                            py: 2,
                            backgroundColor: 'transparent',
                            border: '2px solid rgba(255, 255, 255, 0.5)',
                            borderRadius: 2,
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            }
                        }}
                    >
                        Learn More
                    </AppBox>
                </AppBox>
            </AppBox>
        </AppBox>
    );
}
