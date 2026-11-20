import { FilterIcon } from "../icons.jsx";
import PopupMenu from "./PopupMenu.jsx";

// Nút lọc danh sách hội thoại: menu chọn một (menuitemradio), mở sang phải.
export default function FilterMenu({ options, value, onChange, label = "Lọc hội thoại" }) {
  const current = options.find((o) => o.key === value) ?? options[0];
  return (
    <PopupMenu
      label={`${label}: ${current.label}`}
      title={label}
      icon={<FilterIcon />}
      groupLabel="Hiển thị"
      items={options.map((o) => ({ key: o.label, label: o.label, Icon: o.Icon, role: "menuitemradio", checked: o.key === value, onSelect: () => onChange(o.key) }))}
      triggerClassName="grid size-9 shrink-0 place-items-center rounded-full text-sidebar-icon transition-colors hover:bg-sidebar-item-bg-hover hover:text-sidebar-text focus-visible:outline-2 focus-visible:outline-sidebar-focus-ring aria-expanded:bg-sidebar-item-bg-hover aria-expanded:text-sidebar-text motion-reduce:transition-none [&_svg]:size-[18px]"
    />
  );
}
