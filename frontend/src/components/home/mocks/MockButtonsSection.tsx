import {AppBox} from "@/src/components/ui/AppBox";
import {AppCard} from "@/src/components/ui/AppCard";
import {AppCardContent} from "@/src/components/ui/AppCardContent";
import {AppGrid} from "@/src/components/ui/AppGrid";
import { AppTypography } from "@/src/components/ui/AppTypography";
import CustomButton from "@/src/components/ui/CustomButton";

export default function MockButtonsSection() {
    return (
        <AppBox sx={{ mb: 8 }}>
            {/* Section Title */}
            <AppTypography variant="h5" sx={{ mb: 4, fontWeight: 'bold', color: 'primary.main' }}>
                Mock for Button Variations
            </AppTypography>

            <AppCard sx={{ maxWidth: 800, mx: 'auto', boxShadow: 3 }}>
                <AppCardContent sx={{ p: 4 }}>
                    <AppTypography variant="h6" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
                        Custom Button Showcase
                    </AppTypography>

                    {/* Button Grid */}
                    <AppGrid container spacing={4}>
                        {/* Primary Actions */}
                        <AppGrid item xs={12} md={6}>
                            <AppBox sx={{ textAlign: 'center' }}>
                                <AppTypography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Primary Actions
                                </AppTypography>
                                <AppBox sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                    <CustomButton variant="calculate" />
                                    <CustomButton variant="comment" />
                                </AppBox>
                            </AppBox>
                        </AppGrid>

                        {/* Secondary Actions */}
                        <AppGrid item xs={12} md={6}>
                            <AppBox sx={{ textAlign: 'center' }}>
                                <AppTypography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Secondary Actions
                                </AppTypography>
                                <AppBox sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                    <CustomButton variant="edit" />
                                    <AppBox sx={{ display: 'flex', gap: 2 }}>
                                        <CustomButton variant="edit" size="small" />
                                        <CustomButton variant="comment" size="small" />
                                    </AppBox>
                                </AppBox>
                            </AppBox>
                        </AppGrid>
                    </AppGrid>

                    {/* Button Context */}
                    <AppBox sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                        <AppTypography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                            These custom buttons will replace the current shadcn buttons throughout the site.
                            Each button type serves a specific purpose in the user interface.
                        </AppTypography>
                    </AppBox>
                </AppCardContent>
            </AppCard>
        </AppBox>
    );
}
