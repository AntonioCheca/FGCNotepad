import {AppBox} from "@/src/components/ui/AppBox";
import {AppCard} from "@/src/components/ui/AppCard";
import {AppCardContent} from "@/src/components/ui/AppCardContent";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppGrid} from "@/src/components/ui/AppGrid";
import { AppTypography } from "@/src/components/ui/AppTypography";
import CustomButton from "@/src/components/ui/CustomButton";

export default function MockCalculatorSection() {
    return (
        <AppBox sx={{ mb: 8 }}>
            {/* Section Title */}
            <AppTypography variant="h5" sx={{ mb: 4, fontWeight: 'bold', color: 'primary.main' }}>
                Mock for Frame Data Calculator
            </AppTypography>

            <AppCard sx={{ maxWidth: 600, mx: 'auto', boxShadow: 3 }}>
                <AppCardContent sx={{ p: 4 }}>
                    <AppTypography variant="h6" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
                        Frame Advantage Calculator
                    </AppTypography>

                    <AppBox sx={{ mb: 4 }}>
                        <AppGrid container spacing={3}>
                            <AppGrid item xs={6}>
                                <AppTextField
                                    fullWidth
                                    label="Startup Frames"
                                    type="number"
                                    variant="outlined"
                                    placeholder="8"
                                    size="small"
                                />
                            </AppGrid>
                            <AppGrid item xs={6}>
                                <AppTextField
                                    fullWidth
                                    label="Active Frames"
                                    type="number"
                                    variant="outlined"
                                    placeholder="3"
                                    size="small"
                                />
                            </AppGrid>
                            <AppGrid item xs={6}>
                                <AppTextField
                                    fullWidth
                                    label="Recovery Frames"
                                    type="number"
                                    variant="outlined"
                                    placeholder="12"
                                    size="small"
                                />
                            </AppGrid>
                            <AppGrid item xs={6}>
                                <AppTextField
                                    fullWidth
                                    label="Block Stun"
                                    type="number"
                                    variant="outlined"
                                    placeholder="15"
                                    size="small"
                                />
                            </AppGrid>
                        </AppGrid>
                    </AppBox>

                    {/* Calculate Button */}
                    <AppBox sx={{ textAlign: 'center', mb: 3 }}>
                        <CustomButton variant="calculate" />
                    </AppBox>

                    {/* Results Display */}
                    <AppBox
                        sx={{
                            backgroundColor: 'grey.50',
                            borderRadius: 2,
                            p: 3,
                            textAlign: 'center'
                        }}
                    >
                        <AppTypography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                            Frame Advantage on Block
                        </AppTypography>
                        <AppTypography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            +2
                        </AppTypography>
                        <AppTypography variant="caption" sx={{ color: 'text.disabled' }}>
                            This move is safe and gives you advantage
                        </AppTypography>
                    </AppBox>
                </AppCardContent>
            </AppCard>
        </AppBox>
    );
}
