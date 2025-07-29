import { Box, Card, CardContent } from "@mui/material";
import { AppTypography } from "@/src/components/ui/AppTypography";
import HorizontalLogo from "@/src/components/ui/HorizontalLogo";

export default function MockLogoSection() {
    return (
        <Box sx={{ mb: 8 }}>
            {/* Section Title */}
            <AppTypography variant="h5" sx={{ mb: 4, fontWeight: 'bold', color: 'primary.main' }}>
                Mock for Medium Logo Display
            </AppTypography>

            <Card sx={{ maxWidth: 700, mx: 'auto', boxShadow: 3 }}>
                <CardContent sx={{ p: 6, textAlign: 'center' }}>
                    {/* Medium Logo */}
                    <Box sx={{ mb: 4 }}>
                        <HorizontalLogo size="medium" showSubtitle={false} />
                    </Box>

                    {/* Context Text */}
                    <AppTypography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                        This shows how the medium-sized horizontal logo would appear in content sections,
                        navigation headers, or other places where you need a prominent but not overwhelming
                        brand presence.
                    </AppTypography>

                    {/* Usage Context */}
                    <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                        <AppTypography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                            Perfect for article headers, section dividers, and branded content areas.
                        </AppTypography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
