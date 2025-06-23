
import React from 'react';

interface ScenarioTableControlsProps {
    onDelete: () => void;
    onSolveGame: () => void;
}

export function ScenarioTableControls({ onDelete, onSolveGame }: ScenarioTableControlsProps) {
    return (
        <>
            <button
                className="delete-button"
                onClick={onDelete}
                style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    background: '#ff4d4f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    zIndex: 2
                }}
            >
                ✕
            </button>
            <button
                className="solve-game-button"
                onClick={onSolveGame}
                style={{
                    position: 'absolute',
                    top: '40px',
                    right: '5px',
                    background: "#007bff",
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    zIndex: 2
                }}
            >
                S
            </button>
        </>
    );
}
