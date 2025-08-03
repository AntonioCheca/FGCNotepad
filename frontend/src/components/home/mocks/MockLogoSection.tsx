
import { Box, Card, CardContent, Switch, FormControlLabel, Divider, Grid } from "@mui/material";
import { AppTypography } from "@/src/components/ui/AppTypography";
import { useState } from "react";
import Image from "next/image";

export default function MockLogoSection() {
    const [darkMode, setDarkMode] = useState(false);

    // Logo configurations
    const logoVariants = {
        complete: {
            color: {
                light: "/logos/fgt-completo-color-pos.svg",
                dark: "/logos/fgt-completo-color-neg.svg"
            },
            blackWhite: {
                light: "/logos/fgt-completo-bn-pos.svg",
                dark: "/logos/fgt-completo-bn-neg.svg"
            }
        },
        simplified: {
            color: {
                light: "/logos/fgt-simp-color-pos.svg",
                dark: "/logos/fgt-simp-color-neg.svg"
            },
            blackWhite: {
                light: "/logos/fgt-simp-bn-pos.svg",
                dark: "/logos/fgt-simp-bn-pos.svg" // Using pos as fallback if neg doesn't exist
            }
        },
        favicon: {
            color: {
                light: "/logos/favicon-color-pos.svg",
                dark: "/logos/favicon-color-neg.svg"
            }
        }
    };

    const LogoDisplay = ({ src, title, description }: { src: string; title: string; description: string }) => (
        <Card sx={{
            height: '100%',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6
            }
        }}>
            <CardContent sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <AppTypography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                    {title}
                </AppTypography>

                <Box sx={{
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    minHeight: title.includes('Favicon') ? '80px' : '120px',
                    backgroundColor: darkMode ? 'grey.900' : 'grey.50',
                    borderRadius: 2,
                    p: 2
                }}>
                    <Image
                        src={src}
                        alt={title}
                        width={title.includes('Favicon') ? 48 : title.includes('Simplified') ? 120 : 200}
                        height={title.includes('Favicon') ? 48 : title.includes('Simplified') ? 60 : 100}
                        style={{
                            objectFit: 'contain',
                            maxWidth: '100%',
                            height: 'auto'
                        }}
                    />
                </Box>

                <AppTypography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                    {description}
                </AppTypography>
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ mb: 8 }}>
            {/* Section Title */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <AppTypography variant="h4" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                    Logo Showcase - Designer Drafts
                </AppTypography>

                <AppTypography variant="body1" sx={{ color: 'text.secondary', mb: 3, maxWidth: 600, mx: 'auto' }}>
                    Explore all the logo variations created by our graphic designer. Toggle between light and dark modes
                    to see how each version performs in different contexts.
                </AppTypography>

                {/* Dark Mode Toggle */}
                <FormControlLabel
                    control={
                        <Switch
                            checked={darkMode}
                            onChange={(e) => setDarkMode(e.target.checked)}
                            color="primary"
                        />
                    }
                    label={
                        <AppTypography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {darkMode ? 'Dark Mode Preview' : 'Light Mode Preview'}
                        </AppTypography>
                    }
                />
            </Box>

            {/* Complete Logos Section */}
            <Box sx={{ mb: 6 }}>
                <AppTypography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'secondary.main' }}>
                    Complete Logos
                </AppTypography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <LogoDisplay
                            src={darkMode ? logoVariants.complete.color.dark : logoVariants.complete.color.light}
                            title="Complete - Color"
                            description="Full logo with colors, perfect for main headers and branding materials"
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <LogoDisplay
                            src={darkMode ? logoVariants.complete.blackWhite.dark : logoVariants.complete.blackWhite.light}
                            title="Complete - Black & White"
                            description="Monochrome version for print materials and single-color applications"
                        />
                    </Grid>
                </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Simplified Logos Section */}
            <Box sx={{ mb: 6 }}>
                <AppTypography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'secondary.main' }}>
                    Simplified Logos
                </AppTypography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <LogoDisplay
                            src={darkMode ? logoVariants.simplified.color.dark : logoVariants.simplified.color.light}
                            title="Simplified - Color"
                            description="Streamlined version for smaller spaces and secondary branding"
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <LogoDisplay
                            src={darkMode ? logoVariants.simplified.blackWhite.dark : logoVariants.simplified.blackWhite.light}
                            title="Simplified - Black & White"
                            description="Minimal monochrome version for constrained layouts"
                        />
                    </Grid>
                </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Favicon Section */}
            <Box sx={{ mb: 6 }}>
                <AppTypography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'secondary.main' }}>
                    Favicon & Icon Versions
                </AppTypography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <LogoDisplay
                            src={darkMode ? logoVariants.favicon.color.dark : logoVariants.favicon.color.light}
                            title="Favicon - Color"
                            description="Small icon version for browser tabs, bookmarks, and app icons"
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card sx={{
                            height: '100%',
                            border: '2px dashed',
                            borderColor: 'grey.300'
                        }}>
                            <CardContent sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <AppTypography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                                    Font Files Available
                                </AppTypography>

                                <Box sx={{ mb: 2 }}>
                                    <AppTypography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                                        📁 Thernaly.ttf
                                    </AppTypography>
                                    <AppTypography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                        📁 Thernaly Italic.ttf
                                    </AppTypography>
                                </Box>

                                <AppTypography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                                    Custom typography files ready for integration
                                </AppTypography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            {/* Usage Guidelines */}
            <Card sx={{
                mt: 4,
                backgroundColor: darkMode ? 'grey.900' : 'primary.50',
                border: '1px solid',
                borderColor: darkMode ? 'grey.700' : 'primary.200'
            }}>
                <CardContent sx={{ p: 4 }}>
                    <AppTypography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
                        Usage Recommendations
                    </AppTypography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <AppTypography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'secondary.main' }}>
                                Complete Logos
                            </AppTypography>
                            <AppTypography variant="body2" sx={{ color: 'text.secondary' }}>
                                Use for main headers, landing pages, and primary branding materials where space allows.
                            </AppTypography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <AppTypography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'secondary.main' }}>
                                Simplified Logos
                            </AppTypography>
                            <AppTypography variant="body2" sx={{ color: 'text.secondary' }}>
                                Perfect for navigation bars, footers, and content areas with limited space.
                            </AppTypography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <AppTypography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'secondary.main' }}>
                                Favicon & Icons
                            </AppTypography>
                            <AppTypography variant="body2" sx={{ color: 'text.secondary' }}>
                                Ideal for browser tabs, mobile app icons, and small branded elements.
                            </AppTypography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
}
