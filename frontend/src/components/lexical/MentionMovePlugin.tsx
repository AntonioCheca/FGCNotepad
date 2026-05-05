import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {LexicalTypeaheadMenuPlugin, MenuOption, type MenuTextMatch} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import type {TextNode} from 'lexical';
import {useCallback, useEffect, useMemo, useState} from 'react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import useMoves from '@/hooks/useMoves';
import {$createMentionNode} from '@/src/components/lexical/MentionNode';
import styles from '@/src/components/lexical/style/mentions.module.css';
import {GiPunchBlast} from "react-icons/gi";

const SUGGESTION_LIST_LENGTH_LIMIT = 5;

interface MoveSearchResult {
    id: number | string;
    summary: string;
}

function useMoveLookupService(query: string | null): MoveSearchResult[] {
    const {searchMoves} = useMoves();
    const [results, setResults] = useState<MoveSearchResult[]>([]);

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        let isActive = true;

        const fetchMoves = async () => {
            try {
                const data = await searchMoves(query) as MoveSearchResult[];
                if (isActive) {
                    setResults(data);
                }
            } catch {
                if (isActive) {
                    setResults([]);
                }
            }
        };

        fetchMoves();

        return () => {
            isActive = false;
        };
    }, [query, searchMoves]);

    return results;
}

function checkForMentionMatch(text: string): MenuTextMatch | null {
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
    id: string;
    summary: string;

    constructor(id: string, summary: string) {
        super(id);
        this.id = id;
        this.summary = summary;
    }
}

interface MentionsTypeaheadMenuItemProps {
    index: number;
    isSelected: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    option: MentionTypeaheadOption;
}

function MentionsTypeaheadMenuItem({index, isSelected, onClick, onMouseEnter, option}: MentionsTypeaheadMenuItemProps) {
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
    const [queryString, setQueryString] = useState<string | null>(null);
    const results = useMoveLookupService(queryString);

    const options = useMemo(() =>
            results.map(({id, summary}) => new MentionTypeaheadOption(String(id), summary)).slice(0, SUGGESTION_LIST_LENGTH_LIMIT),
        [results]
    );

    const onSelectOption = useCallback((selectedOption: MentionTypeaheadOption, nodeToReplace: TextNode | null, closeMenu: () => void) => {
        editor.update(() => {
            const mentionNode = $createMentionNode(selectedOption.summary, selectedOption.id, '');
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
