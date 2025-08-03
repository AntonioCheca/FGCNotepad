import React from 'react';
import {useMode} from '@/src/context/ThemeContext';

interface ScenarioTableControlsProps {
    onDelete: () => void;
    onSolveGame: () => void;
}

export function ScenarioTableControls({onDelete, onSolveGame}: ScenarioTableControlsProps) {
    const {mode, theme} = useMode();

    const commonStyle: React.CSSProperties = {
        position: 'absolute',
        right: '5px',
        border: 'none',
        borderRadius: '4px',
        padding: '4px 8px',
        cursor: 'pointer',
        zIndex: 2,
        color: theme.palette.text.primary
    };

    return (
        <>
            <button
                className="delete-button"
                onClick={onDelete}
                style={{
                    ...commonStyle,
                    top: '5px',
                    backgroundColor: mode === 'dark' ? '#ff7875' : '#ff4d4f'
                }}
            >
                ✕
            </button>
            <button
                className="solve-game-button"
                onClick={onSolveGame}
                style={{
                    ...commonStyle,
                    top: '40px',
                    backgroundColor: mode === 'dark' ? '#1677ff' : '#1890ff'
                }}
            >
                S
            </button>
        </>
    );
}
