import {AppBox} from "@/src/components/ui/AppBox";
import {AppCard} from "@/src/components/ui/AppCard";
import {AppCardContent} from "@/src/components/ui/AppCardContent";
import {AppAvatar} from "@/src/components/ui/AppAvatar";
import { AppTypography } from "@/src/components/ui/AppTypography";
import CustomButton from "@/src/components/ui/CustomButton";

export default function MockCommentsSection() {
    return (
        <AppBox sx={{ mb: 8 }}>
            {/* Section Title */}
            <AppTypography variant="h5" sx={{ mb: 4, fontWeight: 'bold', color: 'primary.main' }}>
                Mock for Comments Section
            </AppTypography>

            <AppCard sx={{ maxWidth: 800, mx: 'auto', boxShadow: 3 }}>
                <AppCardContent sx={{ p: 4 }}>
                    {/* Sample Comments */}
                    <AppBox sx={{ mb: 4 }}>
                        <AppBox sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-start' }}>
                            <AppAvatar sx={{ bgcolor: 'primary.main' }}>JD</AppAvatar>
                            <AppBox sx={{ flexGrow: 1 }}>
                                <AppTypography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    John Doe
                                </AppTypography>
                                <AppTypography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                                    Great analysis on frame data! The mathematical approach really helps
                                    understand the neutral game dynamics.
                                </AppTypography>
                                <AppBox sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                    <CustomButton variant="edit" size="small" />
                                    <AppTypography variant="caption" sx={{ color: 'text.disabled', alignSelf: 'center' }}>
                                        2 hours ago
                                    </AppTypography>
                                </AppBox>
                            </AppBox>
                        </AppBox>

                        <AppBox sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-start' }}>
                            <AppAvatar sx={{ bgcolor: 'secondary.main' }}>AS</AppAvatar>
                            <AppBox sx={{ flexGrow: 1 }}>
                                <AppTypography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Alex Smith
                                </AppTypography>
                                <AppTypography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                                    Would love to see more content on option selects and their probability calculations.
                                </AppTypography>
                                <AppBox sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                    <CustomButton variant="edit" size="small" />
                                    <AppTypography variant="caption" sx={{ color: 'text.disabled', alignSelf: 'center' }}>
                                        5 hours ago
                                    </AppTypography>
                                </AppBox>
                            </AppBox>
                        </AppBox>
                    </AppBox>

                    {/* Add Comment Button */}
                    <AppBox sx={{ pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                        <AppBox sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <AppTypography variant="h6" sx={{ fontWeight: 'bold' }}>
                                Join the Discussion
                            </AppTypography>
                            <CustomButton variant="comment" />
                        </AppBox>
                    </AppBox>
                </AppCardContent>
            </AppCard>
        </AppBox>
    );
}
