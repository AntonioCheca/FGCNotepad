import { Box, List, ListItem, ListItemText, Divider } from "@mui/material";
import { AppTypography } from "@/src/components/ui/AppTypography";
import CircularLogo from "@/src/components/ui/CircularLogo";

const sidebarSections = [
    {
        title: "Section 1",
        items: ["Game Theory Basics", "Frame Data", "Neutral Game"]
    },
    {
        title: "Section 2",
        items: ["Character Analysis", "Matchup Charts", "Tournament Data"]
    },
    {
        title: "Section 3",
        items: ["Community", "Discussion", "Resources"]
    }
];

export default function Sidebar() {
    return (
        <Box
            sx={{
                width: 280,
                height: '100vh',
                backgroundColor: 'background.paper',
                borderRight: '1px solid',
                borderColor: 'divider',
                position: 'fixed',
                left: 0,
                top: 0,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Circular Logo at Top */}
            <Box sx={{ p: 2, textAlign: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                <CircularLogo size="small" />
            </Box>

            {/* Navigation Sections */}
            <Box sx={{ flexGrow: 1, pt: 2 }}>
                {sidebarSections.map((section, index) => (
                    <Box key={section.title} sx={{ mb: 3 }}>
                        <Box sx={{ px: 2, mb: 1 }}>
                            <AppTypography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                {section.title}
                            </AppTypography>
                        </Box>

                        <List dense>
                            {section.items.map((item) => (
                                <ListItem
                                    key={item}
                                    button
                                    sx={{
                                        px: 3,
                                        '&:hover': {
                                            backgroundColor: 'action.hover'
                                        }
                                    }}
                                >
                                    <ListItemText
                                        primary={item}
                                        primaryTypographyProps={{
                                            variant: 'body2',
                                            color: 'text.secondary'
                                        }}
                                    />
                                </ListItem>
                            ))}
                        </List>

                        {index < sidebarSections.length - 1 && (
                            <Divider sx={{ mx: 2, mt: 2 }} />
                        )}
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
