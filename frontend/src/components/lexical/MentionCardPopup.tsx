import React, {useState, useEffect} from "react";
import useMoves from "@/hooks/useMoves";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppCard} from "@/src/components/ui/AppCard";
import {AppCardContent} from "@/src/components/ui/AppCardContent";
import {AppChip} from "@/src/components/ui/AppChip";

// Define the props to pass information about the mention.
interface MentionCardPopupProps {
    mentionName: string;
    moveId: string;
    previewText: string | undefined;
    detailsText: string | undefined;
}


const MentionCardPopup: React.FC<MentionCardPopupProps> = ({mentionName, moveId}) => {
    const {getSpecificMove} = useMoves();
    const [moveData, setMoveData] = useState<any>(null); // State to hold move data
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false); // State for hover effect

    useEffect(() => {
        // Fetch the move data using the moveId
        const fetchAndSetMoveData = async (moveId) => {
            try {
                const data = await getSpecificMove(moveId);
                setMoveData(data);
            } catch (error) {
                console.error("Error fetching move data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAndSetMoveData(moveId);
    }, [moveId]);

    if (loading) {
        return (
            <AppBox sx={{display: "flex", justifyContent: "center", alignItems: "center", height: "100px"}}>
                <AppCircularProgress/>
            </AppBox>
        );
    }

    if (!moveData) {
        return <AppTypography variant="body2" color="error">Move data not found</AppTypography>;
    }

    const formatFrameData = (frameData) => {
        const frameEntries = [
            {label: 'St', value: frameData.startup},
            {label: 'Ac', value: frameData.active},
            {label: 'Re', value: frameData.recovery},
            {label: 'Hit', value: frameData.on_hit},
            {label: 'Bl', value: frameData.on_block}
        ];
        return frameEntries
            .filter(entry => entry.value != null) // Only include non-null values
            .map(entry => `${entry.label}: ${entry.value}`)
            .join(', ');
    };

// Preview Text: Summary data (e.g., character name, numpad notation, and summary frame data)
    const previewText = `${moveData.character} ${moveData.numpad_notation}, ${formatFrameData(moveData.summary_frame_data)}`;

// Details Text: Full frame data (e.g., character name, numpad notation, and detailed frame data)
    const detailsText = (
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
            <tr>
                <th style={{textAlign: 'left', padding: '8px', fontWeight: 'bold'}}>Key</th>
                <th style={{textAlign: 'left', padding: '8px', fontWeight: 'bold'}}>Value</th>
            </tr>
            </thead>
            <tbody>
            {Object.entries(moveData.full_frame_data).map(([key, value]) => (
                value != null && (
                    <tr key={key}>
                        <td style={{padding: '8px', fontWeight: 'bold'}}>{key}</td>
                        <td style={{padding: '8px'}}>{value}</td>
                    </tr>
                )
            ))}
            </tbody>
        </table>
    );


    const handleClick = () => {
        setExpanded(!expanded);
    };

    // Handle hover events to toggle preview visibility
    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    return (
        <AppBox sx={{position: "relative", display: "inline-block"}} onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}>
            <AppBox
                sx={{
                    position: "absolute",
                    top: "-60px",
                    left: "0",
                    zIndex: expanded ? -1 : 10,
                    visibility: expanded || !isHovered ? "hidden" : "visible",
                    opacity: expanded || !isHovered ? 0 : 1,
                    transition: "all 0.3s ease",
                }}
            >
                {/* Hover Preview Card */}
                <AppCard sx={{maxWidth: 700, borderRadius: "2px", boxShadow: 2}}>
                    <AppCardContent>
                        <AppTypography variant="body2" color="textSecondary"
                                       sx={{textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden"}}>
                            {previewText}
                        </AppTypography>
                    </AppCardContent>
                </AppCard>
            </AppBox>

            <AppChip
                label={mentionName}
                onClick={handleClick}
                sx={{
                    cursor: "pointer",
                    padding: "0.1rem",
                }}
            >
            </AppChip>

            {expanded && (
                <AppBox
                    sx={{
                        position: "fixed",
                        top: "50%",
                        right: "0",
                        transform: "translateY(-50%)",
                        zIndex: 9999,
                        boxShadow: 3,
                        width: "500px",
                        maxHeight: "500px",
                        overflowY: "auto",
                    }}
                >
                    {/* Expanded Card */}
                    <AppCard>
                        <AppCardContent>
                            <AppTypography variant="h6" color="textPrimary" gutterBottom>
                                {mentionName}
                            </AppTypography>
                            {detailsText}
                        </AppCardContent>
                    </AppCard>
                </AppBox>
            )}
        </AppBox>
    );
};

export default MentionCardPopup;
