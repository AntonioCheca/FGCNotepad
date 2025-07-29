import { Button, IconButton } from "@mui/material";
import { Edit, MessageCircle, Calculator } from "lucide-react";

interface CustomButtonProps {
    variant: 'comment' | 'edit' | 'calculate';
    size?: 'small' | 'medium' | 'large';
    onClick?: () => void;
    disabled?: boolean;
}

const buttonStyles = {
    comment: {
        backgroundColor: '#4CAF50',
        color: 'white',
        '&:hover': {
            backgroundColor: '#45a049',
        }
    },
    edit: {
        backgroundColor: '#2196F3',
        color: 'white',
        '&:hover': {
            backgroundColor: '#1976D2',
        }
    },
    calculate: {
        backgroundColor: '#FF9800',
        color: 'white',
        '&:hover': {
            backgroundColor: '#F57C00',
        }
    }
};

const getButtonContent = (variant: string, size: string) => {
    const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;

    switch (variant) {
        case 'comment':
            return {
                icon: <MessageCircle size={iconSize} />,
                text: 'Post Comment'
            };
        case 'edit':
            return {
                icon: <Edit size={iconSize} />,
                text: 'Edit'
            };
        case 'calculate':
            return {
                icon: <Calculator size={iconSize} />,
                text: 'Calculate'
            };
        default:
            return {
                icon: null,
                text: 'Button'
            };
    }
};

export default function CustomButton({
                                         variant,
                                         size = 'medium',
                                         onClick,
                                         disabled = false
                                     }: CustomButtonProps) {
    const { icon, text } = getButtonContent(variant, size);
    const isIconOnly = variant === 'edit' && size === 'small';

    if (isIconOnly) {
        return (
            <IconButton
                onClick={onClick}
                disabled={disabled}
                sx={{
                    ...buttonStyles[variant],
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                }}
                size={size}
            >
                {icon}
            </IconButton>
        );
    }

    return (
        <Button
            onClick={onClick}
            disabled={disabled}
            startIcon={icon}
            sx={{
                ...buttonStyles[variant],
                px: size === 'small' ? 2 : size === 'large' ? 4 : 3,
                py: size === 'small' ? 1 : size === 'large' ? 1.5 : 1.25,
                borderRadius: 2,
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: size === 'small' ? '0.875rem' : size === 'large' ? '1.125rem' : '1rem',
                boxShadow: 2,
                '&:hover': {
                    boxShadow: 4,
                }
            }}
            size={size}
        >
            {text}
        </Button>
    );
}
