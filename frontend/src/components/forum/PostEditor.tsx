import {useState, useEffect} from "react";
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
import InsertScenarioTableButton from "@/src/components/lexical/InsertScenarioTableButton";
import TagList from "@/src/components/forum/TagList";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppStack} from "@/src/components/ui/AppStack";
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

    return (
        <AppPaper elevation={3} sx={{p: 3}}>
            <AppStack spacing={2}>
                <AdvancedEditableWrapper condition={editable}>
                    <AppTextField
                        label="Post title"
                        value={title}
                        onChange={(e: any) => {
                            setTitle(e.target.value);
                            localStorage.setItem("postDraftTitle", e.target.value);
                        }}
                        required
                    />
                </AdvancedEditableWrapper>

                <LexicalComposer initialConfig={initialConfig}>
                    <AdvancedEditableWrapper condition={editable}>
                        <InsertScenarioTableButton/>
                    </AdvancedEditableWrapper>
                    <RichTextPlugin
                        contentEditable={
                            <ContentEditable
                                className="outline-none p-2 w-full min-h-[150px]"
                                style={{fontSize: "16px", lineHeight: "1.8", fontFamily: "Arial, sans-serif"}}
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


                {/* Render TagList separately */}
                <TagList tags={tags} onTagsChange={handleTagUpdate} editable={editable}/>

                <AdvancedEditableWrapper condition={editable}>
                    <AppButton onClick={handlePostSubmit}>
                        Submit Post
                    </AppButton>
                </AdvancedEditableWrapper>
            </AppStack>
        </AppPaper>
    );
}
