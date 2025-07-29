import { Box, Card, CardContent, Grid } from "@mui/material";
import { AppTypography } from "@/src/components/ui/AppTypography";
import CustomButton from "@/src/components/ui/CustomButton";

export default function MockButtonsSection() {
    return (
        <Box sx={{ mb: 8 }}>
            {/* Section Title */}
            <AppTypography variant="h5" sx={{ mb: 4, fontWeight: 'bold', color: 'primary.main' }}>
                Mock for Button Variations
            </AppTypography>

            <Card sx={{ maxWidth: 800, mx: 'auto', boxShadow: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    <AppTypography variant="h6" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
                        Custom Button Showcase
                    </AppTypography>

                    {/* Button Grid */}
                    <Grid container spacing={4}>
                        {/* Primary Actions */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{ textAlign: 'center' }}>
                                <AppTypography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Primary Actions
                                </AppTypography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                    <CustomButton variant="calculate" />
                                    <CustomButton variant="comment" />
                                </Box>
                            </Box>
                        </Grid>

                        {/* Secondary Actions */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{ textAlign: 'center' }}>
                                <AppTypography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Secondary Actions
                                </AppTypography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                    <CustomButton variant="edit" />
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <CustomButton variant="edit" size="small" />
                                        <CustomButton variant="comment" size="small" />
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Button Context */}
                    <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                        <AppTypography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                            These custom buttons will replace the current shadcn buttons throughout the site.
                            Each button type serves a specific purpose in the user interface.
                        </AppTypography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
