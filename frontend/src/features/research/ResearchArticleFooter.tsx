import {useResearchArticleLikes} from "@/hooks/useResearchArticleLikes";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {DiscordIcon, ThumbUpIcon, ThumbUpOutlinedIcon} from "@/src/components/ui/AppIcons";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {DISCORD_INVITE_URL} from "@/src/data/navigationData";

interface ResearchArticleFooterProps {
    slug: string;
}

const pillStyles = {minHeight: 48, borderRadius: 999, px: 2.25, fontVariantNumeric: "tabular-nums"};

export function ResearchArticleFooter({slug}: ResearchArticleFooterProps) {
    const {count, liked, like, error} = useResearchArticleLikes(slug);

    return (
        <AppBox sx={{display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, pt: 1}}>
            {count !== null ? (
                <AppButton
                    type="button"
                    variant="outlined"
                    onClick={() => void like()}
                    aria-pressed={liked}
                    aria-label={liked ? `You liked this article. ${count} likes` : `Like this article. ${count} likes`}
                    startIcon={liked ? <ThumbUpIcon/> : <ThumbUpOutlinedIcon/>}
                    sx={{
                        ...pillStyles,
                        minWidth: 88,
                        cursor: liked ? "default" : "pointer",
                        color: (theme: Theme) => (liked ? theme.fgc.accent.selected : theme.fgc.text.secondary),
                        borderColor: (theme: Theme) => (liked ? theme.fgc.accent.selected : theme.fgc.border.default),
                    }}
                >
                    {count}
                </AppButton>
            ) : null}
            <AppButton
                type="button"
                variant="outlined"
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<DiscordIcon sx={{fontSize: "28px !important"}}/>}
                sx={{...pillStyles, color: (theme: Theme) => theme.fgc.text.primary, borderColor: (theme: Theme) => theme.fgc.border.default, textTransform: "none"}}
            >
                Join the Discord
            </AppButton>
            {error ? <AppTypography variant="body2" role="status" sx={{flexBasis: "100%", color: (theme: Theme) => theme.fgc.feedback.errorText}}>{error}</AppTypography> : null}
        </AppBox>
    );
}
