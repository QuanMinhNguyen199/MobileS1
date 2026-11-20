import { DeleteIcon, FavoriteIcon, RenameIcon, UnreadIcon } from "./icons.jsx";

// Các thao tác trên một phiên chat, dùng chung cho menu ⋮ ở danh sách (sidebar) và ở header khung chat.
// selected: phiên đang mở (luôn là đã đọc nên không có "Đánh dấu chưa đọc").
// canDelete: còn hơn một phiên (khung chat luôn cần một phiên để hiển thị).
// renameMovesFocus: đổi tên tại chỗ (ô nhập trong danh sách) thì menu không trả focus về nút ⋮.
export function conversationActions(c, { selected, canDelete, onUpdate, onRename, onDelete, renameMovesFocus = false }) {
  const fav = c.tags.includes("favorite");
  return [
    {
      key: "favorite",
      label: fav ? "Bỏ khỏi Yêu thích" : "Thêm vào Yêu thích",
      Icon: FavoriteIcon,
      onSelect: () => onUpdate(c.id, (x) => ({ ...x, tags: fav ? x.tags.filter((t) => t !== "favorite") : [...x.tags, "favorite"] })),
    },
    { key: "rename", label: "Đổi tên", Icon: RenameIcon, movesFocus: renameMovesFocus, onSelect: onRename },
    ...(selected
      ? []
      : [{ key: "unread", label: c.unread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc", Icon: UnreadIcon, onSelect: () => onUpdate(c.id, (x) => ({ ...x, unread: !x.unread })) }]),
    ...(canDelete ? [{ key: "delete", label: "Xóa", Icon: DeleteIcon, onSelect: onDelete }] : []),
  ];
}

export const topicOf = (c) => c.topic ?? c.name;
