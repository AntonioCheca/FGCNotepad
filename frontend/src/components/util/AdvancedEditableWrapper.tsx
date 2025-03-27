import React from 'react';

interface AdvancedEditableWrapperProps {
    condition: boolean;
    children: React.ReactNode;
    fallbackComponent?: React.ReactNode;
}

const AdvancedEditableWrapper: React.FC<AdvancedEditableWrapperProps> = ({
                                                                             condition,
                                                                             children,
                                                                             fallbackComponent = null
                                                                         }) => {
    return condition ? <>{children}</> : fallbackComponent || null;
};

export default AdvancedEditableWrapper;