import SvgIcon, {type SvgIconProps} from "@mui/material/SvgIcon";

export {default as HelpOutlineOutlinedIcon} from "@mui/icons-material/HelpOutlineOutlined";
export {default as ArticleOutlinedIcon} from "@mui/icons-material/ArticleOutlined";
export {default as SearchOutlinedIcon} from "@mui/icons-material/SearchOutlined";
export {default as SportsMartialArtsOutlinedIcon} from "@mui/icons-material/SportsMartialArtsOutlined";
export {default as SportsKabaddiOutlinedIcon} from "@mui/icons-material/SportsKabaddiOutlined";
export {default as AccountCircleOutlinedIcon} from "@mui/icons-material/AccountCircleOutlined";
export {default as SettingsOutlinedIcon} from "@mui/icons-material/SettingsOutlined";
export {default as SportsMmaIcon} from "@mui/icons-material/SportsMma";
export {default as ChevronLeftIcon} from "@mui/icons-material/ChevronLeft";
export {default as ChevronRightIcon} from "@mui/icons-material/ChevronRight";
export {default as CloseIcon} from "@mui/icons-material/Close";
export {default as MenuIcon} from "@mui/icons-material/Menu";
export {default as Brightness4Icon} from "@mui/icons-material/Brightness4";
export {default as Brightness7Icon} from "@mui/icons-material/Brightness7";
export {default as DeleteIcon} from "@mui/icons-material/Delete";
export {default as AddIcon} from "@mui/icons-material/Add";
export {default as BoltIcon} from "@mui/icons-material/Bolt";
export {default as CheckCircleOutlineIcon} from "@mui/icons-material/CheckCircleOutline";
export {default as ErrorOutlineIcon} from "@mui/icons-material/ErrorOutline";
export {default as PendingActionsIcon} from "@mui/icons-material/PendingActions";
export {default as ScheduleIcon} from "@mui/icons-material/Schedule";
export {default as TimelineIcon} from "@mui/icons-material/Timeline";
export {default as WarningAmberIcon} from "@mui/icons-material/WarningAmber";
export {default as ArrowUpwardIcon} from "@mui/icons-material/ArrowUpward";
export {default as ArrowDownwardIcon} from "@mui/icons-material/ArrowDownward";
export {default as ChatBubbleOutlineIcon} from "@mui/icons-material/ChatBubbleOutline";
export {default as AltRouteIcon} from "@mui/icons-material/AltRoute";
export {default as TuneIcon} from "@mui/icons-material/Tune";
export {default as QueryStatsIcon} from "@mui/icons-material/QueryStats";
export {default as ShieldOutlinedIcon} from "@mui/icons-material/ShieldOutlined";
export {default as FactCheckOutlinedIcon} from "@mui/icons-material/FactCheckOutlined";
export {default as TableChartOutlinedIcon} from "@mui/icons-material/TableChartOutlined";
export {default as Inventory2OutlinedIcon} from "@mui/icons-material/Inventory2Outlined";
export {default as PlaceOutlinedIcon} from "@mui/icons-material/PlaceOutlined";
export {default as ManageAccountsOutlinedIcon} from "@mui/icons-material/ManageAccountsOutlined";
export {default as UploadFileOutlinedIcon} from "@mui/icons-material/UploadFileOutlined";
export {default as LightbulbOutlinedIcon} from "@mui/icons-material/LightbulbOutlined";
export {default as LogoutIcon} from "@mui/icons-material/Logout";
export {default as UnfoldMoreIcon} from "@mui/icons-material/UnfoldMore";
export {default as HomeOutlinedIcon} from "@mui/icons-material/HomeOutlined";
export {default as MoreHorizIcon} from "@mui/icons-material/MoreHoriz";
export {default as GpsFixedOutlinedIcon} from "@mui/icons-material/GpsFixedOutlined";
export {default as BorderStyleOutlinedIcon} from "@mui/icons-material/BorderStyleOutlined";
export {default as KeyboardTabOutlinedIcon} from "@mui/icons-material/KeyboardTabOutlined";
export {default as KeyboardDoubleArrowUpOutlinedIcon} from "@mui/icons-material/KeyboardDoubleArrowUpOutlined";
export {default as AccessibilityNewOutlinedIcon} from "@mui/icons-material/AccessibilityNewOutlined";
export {default as SwapHorizOutlinedIcon} from "@mui/icons-material/SwapHorizOutlined";
export {default as TokenOutlinedIcon} from "@mui/icons-material/TokenOutlined";
export {default as SignalCellularAltOutlinedIcon} from "@mui/icons-material/SignalCellularAltOutlined";
export {default as AutoAwesomeOutlinedIcon} from "@mui/icons-material/AutoAwesomeOutlined";
export {default as CategoryOutlinedIcon} from "@mui/icons-material/CategoryOutlined";

// Martial artist kicking a figure (Boy tilted 30°) off its feet, built from the MUI icon paths.
// Two figures side by side read small in a square icon, so it is drawn 30% larger; a transform keeps its layout slot unchanged.
export function OkiKnockdownIcon({sx, ...props}: SvgIconProps) {
    return (
        <SvgIcon {...props} sx={[{transform: "scale(1.3)"}, ...(Array.isArray(sx) ? sx : [sx])]}>
            <g transform="translate(-1.66 6.16) scale(0.72)">
                <path d="m19.8 2-8.2 6.7-1.21-1.04 3.6-2.08L9.41 1 8 2.41l2.74 2.74L5 8.46l-1.19 4.29L6.27 17 8 16l-2.03-3.52.35-1.3L9.5 13l.5 9h2l.5-10L21 3.4z"/>
                <circle cx="5" cy="5" r="2"/>
            </g>
            <g transform="translate(6.44 0.44) scale(0.88) rotate(30 12 12)">
                <path d="M12 7.5c.97 0 1.75-.78 1.75-1.75S12.97 4 12 4s-1.75.78-1.75 1.75S11.03 7.5 12 7.5M14 20v-5h1v-4.5c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2V15h1v5z"/>
            </g>
        </SvgIcon>
    );
}
