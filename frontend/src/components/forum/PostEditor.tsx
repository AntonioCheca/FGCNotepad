import {ChangeEvent, useState, useEffect} from "react";
import {LexicalComposer} from "@lexical/react/LexicalComposer";
import {RichTextPlugin} from "@lexical/react/LexicalRichTextPlugin";
import {ContentEditable} from "@lexical/react/LexicalContentEditable";
import {HistoryPlugin} from "@lexical/react/LexicalHistoryPlugin";
import {AutoFocusPlugin} from "@lexical/react/LexicalAutoFocusPlugin";
import {LexicalErrorBoundary} from "@lexical/react/LexicalErrorBoundary";
import {CodeNode} from "@lexical/code";
import {LinkNode} from "@lexical/link";
import {ListNode, ListItemNode} from "@lexical/list";
import {HeadingNode, QuoteNode} from "@lexical/rich-text";
import {HorizontalRuleNode} from "@lexical/react/LexicalHorizontalRuleNode";
import {TRANSFORMERS} from "@lexical/markdown";
import {MarkdownShortcutPlugin} from "@lexical/react/LexicalMarkdownShortcutPlugin";
import {
    RestoreFromLocalStoragePlugin,
    LoadFromJsonStringPlugin
} from "@/src/components/lexical/RestoreFromLocalStoragePlugin";
import MentionMovePlugin from "@/src/components/lexical/MentionMovePlugin";
import {MentionNode} from "@/src/components/lexical/MentionNode";
import {ScenarioTableNode} from "@/src/components/lexical/ScenarioTableNode";
import TagList from "@/src/components/forum/TagList";
import {HelpOutlineOutlinedIcon} from "@/src/components/ui/AppIcons";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppDialog} from "@/src/components/ui/AppDialog";
import {AppDialogActions} from "@/src/components/ui/AppDialogActions";
import {AppDialogContent} from "@/src/components/ui/AppDialogContent";
import {AppDialogTitle} from "@/src/components/ui/AppDialogTitle";
import {AppIconButton} from "@/src/components/ui/AppIconButton";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTooltip} from "@/src/components/ui/AppTooltip";
import {AppTypography} from "@/src/components/ui/AppTypography";
import AdvancedEditableWrapper from "@/src/components/util/AdvancedEditableWrapper";

interface PostEditorProps {
    onSubmit: (title: string, body: string, tags: string[]) => void;
    initialTitle: string;
    initialBody: string;
    initialTags: string[];
    editable: boolean;
}

const theme = {
    paragraph: "editor-paragraph"
};

function onError(error: Error) {
    console.error(error);
}

const markdownExamples = [
    {syntax: "# Heading 1", description: "Large page heading"},
    {syntax: "## Heading 2", description: "Section heading"},
    {syntax: "**bold text**", description: "Bold emphasis"},
    {syntax: "*italic text*", description: "Italic emphasis"},
    {syntax: "- List item", description: "Bulleted list"},
    {syntax: "1. Ordered item", description: "Numbered list"},
    {syntax: "[Label](https://example.com)", description: "Clickable link"},
    {syntax: "`inline code`", description: "Inline code style"},
    {syntax: "```\ncode block\n```", description: "Code block"},
    {syntax: "> Quoted text", description: "Quote block"}
];

export default function PostEditor({
                                       onSubmit,
                                       initialTitle = "",
                                       initialBody = "",
                                       initialTags = [],
                                       editable = true
                                    }: PostEditorProps) {
    const [title, setTitle] = useState(initialTitle);
    const [body, setBody] = useState(initialBody);
    const [tags, setTags] = useState<string[]>(initialTags);
    const [isMarkdownGuideOpen, setIsMarkdownGuideOpen] = useState(false);

    const initialConfig = {
        namespace: "MyEditor",
        theme,
        onError,
        nodes: [
            HorizontalRuleNode,
            CodeNode,
            LinkNode,
            ListNode,
            ListItemNode,
            HeadingNode,
            MentionNode,
            ScenarioTableNode,
            QuoteNode
        ],
        editable: editable
    };

    const loadDataFromLocalStorage = () => {
        if (editable) {
            const savedTitle = localStorage.getItem("postDraftTitle");
            const savedBody = localStorage.getItem("postDraftBody");
            if (savedTitle) setTitle(savedTitle);
            if (savedBody) setBody(savedBody);
        }
    };

    useEffect(() => {
        loadDataFromLocalStorage();
    }, [loadDataFromLocalStorage]);

    const handlePostSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loadDataFromLocalStorage();
        onSubmit(title, body, tags);
    };

    const handleTagUpdate = (updatedTags: string[]) => {
        setTags(updatedTags);
    };

    const openMarkdownGuide = () => {
        setIsMarkdownGuideOpen(true);
    };

    const closeMarkdownGuide = () => {
        setIsMarkdownGuideOpen(false);
    };

    return (
        <AppPaper elevation={3} sx={{p: 3, width: "100%", maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box"}}>
            <AppStack spacing={2} sx={{width: "100%", maxWidth: "100%", minWidth: 0}}>
                <AdvancedEditableWrapper condition={editable}>
                    <AppTextField
                        label="Post title"
                        value={title}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setTitle(e.target.value);
                            localStorage.setItem("postDraftTitle", e.target.value);
                        }}
                        required
                    />
                </AdvancedEditableWrapper>

                <div style={{width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden", boxSizing: "border-box"}}>
                    <AdvancedEditableWrapper condition={editable}>
                        <AppBox sx={{display: "flex", alignItems: "center", gap: 0.75, mb: 1.25}}>
                            <AppTooltip
                                arrow
                                placement="right"
                                disableInteractive={false}
                                enterTouchDelay={0}
                                leaveDelay={220}
                                title={
                                    <AppBox sx={{display: "flex", flexDirection: "column", gap: 0.75, py: 0.25, maxWidth: 280}}>
                                        <AppTypography variant="body2" sx={{color: "inherit", lineHeight: 1.45}}>
                                            This post editor accepts Markdown shortcuts while you type.
                                        </AppTypography>
                                        <AppButton
                                            type="button"
                                            variant="text"
                                            color="secondary"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                openMarkdownGuide();
                                            }}
                                            sx={{
                                                alignSelf: "flex-start",
                                                px: 0,
                                                py: 0,
                                                minWidth: 0,
                                                textDecoration: "underline",
                                                fontWeight: 600,
                                                color: "inherit",
                                                "&:hover": {
                                                    textDecoration: "underline",
                                                },
                                            }}
                                        >
                                            Open Markdown quick guide
                                        </AppButton>
                                    </AppBox>
                                }
                            >
                                <AppIconButton
                                    size="small"
                                    aria-label="Open Markdown help"
                                    onClick={openMarkdownGuide}
                                    sx={(theme) => ({
                                        color: theme.fgc.accent.selected,
                                        p: 0.45,
                                        border: `1px solid ${theme.fgc.border.default}`,
                                        backgroundColor: theme.fgc.surface.subtle,
                                        "&:hover": {
                                            backgroundColor: theme.fgc.selection.hover,
                                            borderColor: theme.fgc.border.strong,
                                        },
                                    })}
                                >
                                    <HelpOutlineOutlinedIcon sx={{fontSize: 16}}/>
                                </AppIconButton>
                            </AppTooltip>
                            <AppTypography variant="caption" sx={(theme) => ({color: theme.fgc.typographyRole.helper})}>
                                Markdown supported
                            </AppTypography>
                        </AppBox>
                    </AdvancedEditableWrapper>

                    <LexicalComposer initialConfig={initialConfig}>
                        <RichTextPlugin
                            contentEditable={
                                <ContentEditable
                                    className="outline-none p-2 w-full min-h-[150px]"
                                    style={{
                                        fontSize: "16px",
                                        lineHeight: "1.8",
                                        fontFamily: "Arial, sans-serif",
                                        width: "100%",
                                        maxWidth: "100%",
                                        minWidth: 0,
                                        overflowX: "hidden",
                                        boxSizing: "border-box",
                                        outline: "none",
                                        border: "none",
                                        boxShadow: "none",
                                        WebkitTapHighlightColor: "transparent",
                                    }}
                                />
                            }
                            ErrorBoundary={LexicalErrorBoundary}
                        />
                        <MarkdownShortcutPlugin transformers={TRANSFORMERS}/>
                        <MentionMovePlugin/>
                        <HistoryPlugin/>
                        <AdvancedEditableWrapper condition={editable}>
                            <RestoreFromLocalStoragePlugin/>
                        </AdvancedEditableWrapper>
                        <AdvancedEditableWrapper condition={!editable}>
                            <LoadFromJsonStringPlugin jsonString={initialBody ?? body}/>
                        </AdvancedEditableWrapper>
                        <AutoFocusPlugin/>
                    </LexicalComposer>
                </div>


                <TagList tags={tags} onTagsChange={handleTagUpdate} editable={editable}/>

                <AdvancedEditableWrapper condition={editable}>
                    <AppButton onClick={handlePostSubmit}>
                        Submit Post
                    </AppButton>
                </AdvancedEditableWrapper>
            </AppStack>

            <AppDialog
                open={isMarkdownGuideOpen}
                onClose={closeMarkdownGuide}
                fullWidth
                maxWidth="sm"
                aria-labelledby="markdown-quick-guide-title"
            >
                <AppDialogTitle
                    id="markdown-quick-guide-title"
                    sx={(theme) => ({
                        borderBottom: `1px solid ${theme.fgc.border.default}`,
                        backgroundColor: theme.fgc.surface.raised,
                    })}
                >
                    Markdown quick guide
                </AppDialogTitle>
                <AppDialogContent
                    dividers
                    sx={(theme) => ({
                        backgroundColor: theme.fgc.surface.base,
                        borderColor: theme.fgc.border.default,
                    })}
                >
                    <AppTypography variant="body2" sx={(theme) => ({mb: 1.5, color: theme.fgc.text.secondary})}>
                        Use these common patterns directly in the editor body.
                    </AppTypography>
                    <AppStack spacing={1}>
                        {markdownExamples.map((example) => (
                            <AppBox
                                key={example.syntax}
                                sx={(theme) => ({
                                    display: "grid",
                                    gridTemplateColumns: "minmax(0, 160px) minmax(0, 1fr)",
                                    alignItems: "center",
                                    gap: 1,
                                    px: 1.2,
                                    py: 0.9,
                                    borderRadius: 1,
                                    border: `1px solid ${theme.fgc.border.default}`,
                                    backgroundColor: theme.fgc.surface.subtle,
                                    "@media (max-width: 640px)": {
                                        gridTemplateColumns: "1fr",
                                        gap: 0.5,
                                    },
                                })}
                            >
                                <AppTypography
                                    component="code"
                                    variant="body2"
                                    sx={(theme) => ({
                                        fontFamily: "Consolas, 'Courier New', monospace",
                                        color: theme.fgc.text.primary,
                                        backgroundColor: theme.fgc.surface.sunken,
                                        border: `1px solid ${theme.fgc.border.subtle}`,
                                        borderRadius: 0.75,
                                        px: 0.75,
                                        py: 0.25,
                                        display: "inline-block",
                                        width: "fit-content",
                                    })}
                                >
                                    {example.syntax}
                                </AppTypography>
                                <AppTypography variant="body2" sx={(theme) => ({color: theme.fgc.text.secondary})}>
                                    {example.description}
                                </AppTypography>
                            </AppBox>
                        ))}
                    </AppStack>
                </AppDialogContent>
                <AppDialogActions sx={(theme) => ({backgroundColor: theme.fgc.surface.raised})}>
                    <AppButton type="button" variant="outlined" color="secondary" onClick={closeMarkdownGuide}>
                        Close
                    </AppButton>
                </AppDialogActions>
            </AppDialog>
        </AppPaper>
    );
}
