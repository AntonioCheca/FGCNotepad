
import React from 'react';

interface ScenarioTableLayoutProps {
    children: React.ReactNode;
    onBottomAreaClick?: (event: React.MouseEvent) => void;
}

export function ScenarioTableLayout({ children, onBottomAreaClick }: ScenarioTableLayoutProps) {
    return (
        <div
            className="scenario-table-container"
            style={{
                position: 'relative',
                marginTop: '10px'
            }}
            onClick={onBottomAreaClick}
        >
            {children}
        </div>
    );
}
