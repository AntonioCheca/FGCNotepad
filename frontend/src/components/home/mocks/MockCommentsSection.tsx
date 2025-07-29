import { Box, Card, CardContent, Avatar } from "@mui/material";
import { AppTypography } from "@/src/components/ui/AppTypography";
import CustomButton from "@/src/components/ui/CustomButton";

export default function MockCommentsSection() {
    return (
        <Box sx={{ mb: 8 }}>
            {/* Section Title */}
            <AppTypography variant="h5" sx={{ mb: 4, fontWeight: 'bold', color: 'primary.main' }}>
                Mock for Comments Section
            </AppTypography>

            <Card sx={{ maxWidth: 800, mx: 'auto', boxShadow: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    {/* Sample Comments */}
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-start' }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>JD</Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                                <AppTypography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    John Doe
                                </AppTypography>
                                <AppTypography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                                    Great analysis on frame data! The mathematical approach really helps
                                    understand the neutral game dynamics.
                                </AppTypography>
                                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                    <CustomButton variant="edit" size="small" />
                                    <AppTypography variant="caption" sx={{ color: 'text.disabled', alignSelf: 'center' }}>
                                        2 hours ago
                                    </AppTypography>
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-start' }}>
                            <Avatar sx={{ bgcolor: 'secondary.main' }}>AS</Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                                <AppTypography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Alex Smith
                                </AppTypography>
                                <AppTypography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                                    Would love to see more content on option selects and their probability calculations.
                                </AppTypography>
                                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                    <CustomButton variant="edit" size="small" />
                                    <AppTypography variant="caption" sx={{ color: 'text.disabled', alignSelf: 'center' }}>
                                        5 hours ago
                                    </AppTypography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Add Comment Button */}
                    <Box sx={{ pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <AppTypography variant="h6" sx={{ fontWeight: 'bold' }}>
                                Join the Discussion
                            </AppTypography>
                            <CustomButton variant="comment" />
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
