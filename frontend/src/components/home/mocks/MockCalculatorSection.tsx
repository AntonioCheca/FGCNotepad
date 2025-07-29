import { Box, Card, CardContent, TextField, Grid } from "@mui/material";
import { AppTypography } from "@/src/components/ui/AppTypography";
import CustomButton from "@/src/components/ui/CustomButton";

export default function MockCalculatorSection() {
    return (
        <Box sx={{ mb: 8 }}>
            {/* Section Title */}
            <AppTypography variant="h5" sx={{ mb: 4, fontWeight: 'bold', color: 'primary.main' }}>
                Mock for Frame Data Calculator
            </AppTypography>

            <Card sx={{ maxWidth: 600, mx: 'auto', boxShadow: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    <AppTypography variant="h6" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
                        Frame Advantage Calculator
                    </AppTypography>

                    <Box sx={{ mb: 4 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Startup Frames"
                                    type="number"
                                    variant="outlined"
                                    placeholder="8"
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Active Frames"
                                    type="number"
                                    variant="outlined"
                                    placeholder="3"
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Recovery Frames"
                                    type="number"
                                    variant="outlined"
                                    placeholder="12"
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Block Stun"
                                    type="number"
                                    variant="outlined"
                                    placeholder="15"
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Calculate Button */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <CustomButton variant="calculate" />
                    </Box>

                    {/* Results Display */}
                    <Box
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
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
