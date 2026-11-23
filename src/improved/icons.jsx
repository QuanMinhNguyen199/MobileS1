import { createElement } from "react";
// Import từng icon theo tên để bundler chỉ đóng gói icon đang dùng
import {
  ArrowLeft, ArrowUp, Bell, BookOpenText, Check, ChevronDown as LChevronDown, ChevronUp as LChevronUp, CircleCheck, CircleX, Copy, Download,
  ChevronLeft, Ellipsis, EllipsisVertical, ExternalLink, SendHorizontal, Share, Share2, FileText, Info, KeyRound, Link, ListFilter, LogIn, LogOut, Menu, MessageSquareDot, MessageSquarePlus, MessageSquareText, Mic, Paperclip, Pencil, Plus, RotateCw,
  Search, Settings, ShieldCheck, SlidersHorizontal, Smile, Square, SquarePen, Star, ThumbsDown, ThumbsUp, Trash2, TriangleAlert, UserPlus,
  Users, X,
} from "lucide-react";
import { ICONS, STROKE, lucideFor } from "./icon-data.js";

const LUCIDE = {
  ArrowLeft, ArrowUp, Bell, BookOpenText, Check, ChevronDown: LChevronDown, ChevronUp: LChevronUp, CircleCheck, CircleX, Copy, Download,
  ChevronLeft, Ellipsis, EllipsisVertical, ExternalLink, SendHorizontal, Share, Share2, FileText, Info, KeyRound, Link, ListFilter, LogIn, LogOut, Menu, MessageSquareDot, MessageSquarePlus, MessageSquareText, Mic, Paperclip, Pencil, Plus, RotateCw,
  Search, Settings, ShieldCheck, SlidersHorizontal, Smile, Square, SquarePen, Star, ThumbsDown, ThumbsUp, Trash2, TriangleAlert, UserPlus,
  Users, X,
};

// GeoIcon: icon của GeoAgent, dựng trên Lucide.
// Mặc định là trang trí (aria-hidden): đặt tên cho nút chứa icon. Icon đứng riêng mang thông tin thì truyền label.
// strokeWidth tính bằng px hiển thị và giữ nguyên ở mọi cỡ (16, 20, 24…).
// platform: "shared" (mặc định) | "ios" | "android"; dùng bản riêng của nền tảng nếu icon có.
export function GeoIcon({ name, size = 20, strokeWidth = STROKE, platform = "shared", label, style, ...props }) {
  const definition = ICONS[name];
  if (!definition) throw new Error(`Unknown GeoAgent icon: ${name}`);
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };
  const common = { focusable: "false", "data-geo-icon": name, style: { flexShrink: 0, ...style }, ...a11y, ...props };

  if (definition.lucide) {
    const Icon = LUCIDE[lucideFor(definition, platform)];
    return <Icon size={size} strokeWidth={strokeWidth} absoluteStrokeWidth {...common} />;
  }

  // Dấu hiệu tự vẽ (assistant): lưới 24, cùng độ dày nét hiển thị với icon Lucide
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={(strokeWidth * 24) / size}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...common}
    >
      {definition.nodes.map(([tag, attributes], index) => createElement(tag, { ...attributes, key: index }))}
    </svg>
  );
}

const icon = (name) => {
  const Component = (props) => <GeoIcon name={name} {...props} />;
  Component.displayName = `GeoIcon(${name})`;
  return Component;
};

export const SearchIcon = icon("search");
export const MoreIcon = icon("more");
export const EditIcon = icon("edit");
export const NewChatIcon = icon("new-chat");
export const GroupIcon = icon("group");
export const GroupAddIcon = icon("group-add");
export const ChevronDown = icon("chevron-down");
export const ChevronUp = icon("chevron-up");
export const BackIcon = icon("back");
export const CloseIcon = icon("close");
export const ChatIcon = icon("chat");
export const InfoIcon = icon("info");
export const SmileIcon = icon("smile");
export const SendIcon = icon("send");
export const ClipIcon = icon("attach");
export const MenuIcon = icon("menu");
export const SignInIcon = icon("sign-in");
export const AssistantIcon = icon("assistant");
export const MicIcon = icon("microphone");
export const ShareIcon = icon("share");
export const SettingsIcon = icon("settings");
export const ExternalLinkIcon = icon("external-link");
export const DocumentIcon = icon("document");
export const FilterIcon = icon("filter");
export const UnreadIcon = icon("unread");
export const FavoriteIcon = icon("favorite");
export const CheckIcon = icon("check");
export const RenameIcon = icon("rename");
export const DeleteIcon = icon("delete");
export const SignOutIcon = icon("sign-out");
export const CopyIcon = icon("copy");
export const DownloadIcon = icon("download");
export const RetryIcon = icon("retry");
export const WarningIcon = icon("warning");
export const SourcesIcon = icon("sources");
