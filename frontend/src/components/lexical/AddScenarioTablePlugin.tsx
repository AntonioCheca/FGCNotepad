import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {useCallback} from 'react';
import {$createScenarioTableNode} from '@/src/components/lexical/ScenarioTableNode';
import {$getRoot, $isElementNode} from 'lexical';
import {AppButton} from "@/src/components/ui/AppButton";


export default function AddScenarioTablePlugin() {
    const [editor] = useLexicalComposerContext();

    const addScenarioTable = useCallback(() => {
        editor.update(() => {
            // Get the root of the editor
            const root = $getRoot();

            // Get the last child of the root node
            const children = root.getChildren();
            const lastChild = children[children.length - 1];

            // Define the dummy data for the table
            const dummyData = {
                rows: ["Player 1 move"],
                columns: ["Player 2 move"],
                values: [[0]] // This represents the cell with value 0
            };

            // Deconstruct dummyData into individual variables
            const {rows, columns, values} = dummyData;

            // Create and apply the new ScenarioTableNode
            const tableNode = $createScenarioTableNode(rows, columns, values);

            // If there are children, insert the table node after the last child
            if ($isElementNode(lastChild)) {
                lastChild.insertAfter(tableNode);
            } else {
                // If there are no children, just append it to the root
                root.append(tableNode);
            }
        });
    }, [editor]);

    return (
        <AppButton
            onClick={addScenarioTable}
            variant="contained"
            color="secondary"
            sx={{my: 2}}
        >
            Add Scenario Table
        </AppButton>
    );
}
