import {AppBox} from "@/src/components/ui/AppBox";
import { AppTypography } from "@/src/components/ui/AppTypography";
import MockCommentsSection from "@/src/components/home/mocks/MockCommentsSection";
import MockCalculatorSection from "@/src/components/home/mocks/MockCalculatorSection";
import MockLogoSection from "@/src/components/home/mocks/MockLogoSection";
import MockButtonsSection from "@/src/components/home/mocks/MockButtonsSection";

export default function MockSections() {
    return (
        <AppBox sx={{ py: 6 }}>
            {/* Introduction Text */}
            <AppBox sx={{ textAlign: 'center', mb: 6, px: 3 }}>
                <AppTypography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
                    Fighting Game Theory Hub
                </AppTypography>

                <AppTypography variant="body1" sx={{ maxWidth: 800, mx: 'auto', lineHeight: 1.8, color: 'text.secondary' }}>
                    Welcome to the ultimate resource for understanding the mathematical and strategic foundations
                    of fighting games. Explore frame data, analyze matchups, and master the theory behind
                    competitive play.
                </AppTypography>
            </AppBox>

            {/* Mock Sections Container */}
            <AppBox sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>
                {/* Mock for Medium Logo */}
                <MockLogoSection />

                {/* Mock for Calculator Button */}
                <MockCalculatorSection />

                {/* Mock for Comments Section */}
                <MockCommentsSection />

                {/* Mock for Various Buttons */}
                <MockButtonsSection />
            </AppBox>
        </AppBox>
    );
}
