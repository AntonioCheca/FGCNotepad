import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
    LexicalTypeaheadMenuPlugin,
    MenuOption,
    MenuTextMatch,
    useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import {TextNode} from 'lexical';
import {useCallback, useEffect, useMemo, useState} from 'react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {searchMoves} from '@/services/api';
import {$createMentionNode} from '@/src/components/lexical/MentionNode';
import styles from '@/src/components/lexical/style/mentions.module.css';
import {GiPunchBlast} from "react-icons/gi";

const TRIGGER = '@';
const SUGGESTION_LIST_LENGTH_LIMIT = 5;

function useMoveLookupService(query) {
    const [results, setResults] = useState([]);

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        let isActive = true;
        searchMoves(query)
            .then((data) => {
                if (isActive) {
                    setResults(data);
                }
            })
            .catch(() => {
                if (isActive) {
                    setResults([]);
                }
            });

        return () => {
            isActive = false;
        };
    }, [query]);

    return results;
}

function checkForMentionMatch(text: string) {
    const match = text.match(/(^|\s)@([\w\s]*)$/);
    return match
        ? {
            leadOffset: match.index! + match[1].length,
            matchingString: match[2].trim(), // Trim to remove accidental leading spaces
            replaceableString: match[0]
        }
        : null;
}


class MentionTypeaheadOption extends MenuOption {
    constructor(id, summary) {
        super(id);
        this.id = id;
        this.summary = summary;
    }
}

function MentionsTypeaheadMenuItem({index, isSelected, onClick, onMouseEnter, option}) {
    return (
        <li
            key={option.key}
            tabIndex={-1}
            className={`${styles['suggestion-menu-item']}`}
            ref={option.setRefElement}
            role="option"
            aria-selected={isSelected}
            id={`typeahead-item-${index}`}
            onMouseEnter={onMouseEnter}
            onClick={onClick}
        >

            <GiPunchBlast className={styles['move-icon']}/>
            <span className="text">{option.summary}</span>
        </li>
    );
}

export default function NewMentionsPlugin() {
    const [editor] = useLexicalComposerContext();
    const [queryString, setQueryString] = useState(null);
    const results = useMoveLookupService(queryString);

    const options = useMemo(() =>
            results.map(({id, summary}) => new MentionTypeaheadOption(id, summary)).slice(0, SUGGESTION_LIST_LENGTH_LIMIT),
        [results]
    );

    const onSelectOption = useCallback((selectedOption, nodeToReplace, closeMenu) => {
        editor.update(() => {
            const mentionNode = $createMentionNode(selectedOption.summary, selectedOption.id);
            if (nodeToReplace) {
                nodeToReplace.replace(mentionNode);
            }

            closeMenu();
        });
    }, [editor]);

    return (
        <LexicalTypeaheadMenuPlugin
            onQueryChange={setQueryString}
            onSelectOption={onSelectOption}
            triggerFn={checkForMentionMatch}
            options={options}
            menuRenderFn={(anchorElementRef, {selectedIndex, selectOptionAndCleanUp, setHighlightedIndex}) =>
                anchorElementRef.current && results.length ? (
                    ReactDOM.createPortal(
                        <div className={styles['suggestion-menu']}>

                            {options.map((option, i) => (

                                <MentionsTypeaheadMenuItem
                                    index={i}
                                    isSelected={selectedIndex === i}
                                    onClick={() => {
                                        setHighlightedIndex(i);
                                        selectOptionAndCleanUp(option);
                                    }}
                                    onMouseEnter={() => setHighlightedIndex(i)}
                                    key={option.key}
                                    option={option}
                                />
                            ))}
                        </div>,
                        anchorElementRef.current
                    )
                ) : null
            }
        />

    );
}
