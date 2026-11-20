import { useEffect, useId, useRef } from "react";

// Hộp thoại xác nhận xóa và đổi tên phiên chat (dialog modal gốc của trình duyệt: khóa trang, giữ focus,
// Esc để hủy, đóng xong trả focus về nút đã mở). closedby="any": bấm ra ngoài cũng hủy; trình duyệt chưa hỗ trợ
// thì dùng onClick bên dưới.
const secondary =
  "h-10 rounded-full border border-button-secondary-border px-4 text-sm font-medium text-button-secondary-text hover:bg-button-secondary-bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";
const primary =
  "h-10 rounded-full bg-button-primary-bg px-4 text-sm font-medium text-button-primary-label hover:bg-button-primary-bg-hover active:bg-button-primary-bg-pressed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

function useModal(target) {
  const ref = useRef(null);
  useEffect(() => {
    if (!target) return;
    const d = ref.current;
    d.returnValue = "";
    d.showModal();
  }, [target]);
  return ref;
}

const dialogProps = (ref) => ({
  ref,
  closedby: "any",
  onClick: (e) => {
    if ("closedBy" in HTMLDialogElement.prototype || e.target !== e.currentTarget) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.currentTarget.close("cancel");
  },
  className:
    "m-auto w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-menu-border bg-menu-bg p-5 text-menu-text shadow-card backdrop:bg-overlay-scrim",
});

// target: { id, topic } hoặc null. onConfirm(id) chạy khi bấm Xóa; onDone() khi hộp đóng (dù xóa hay hủy).
export function DeleteDialog({ target, onConfirm, onDone }) {
  const ref = useModal(target);
  const id = useId();
  useEffect(() => {
    // Mặc định focus vào "Hủy": đây là thao tác không hoàn tác được
    if (target) ref.current.querySelector("button[value=cancel]").focus();
  }, [target, ref]);
  return (
    <dialog
      {...dialogProps(ref)}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-desc`}
      onClose={() => {
        if (ref.current.returnValue === "delete" && target) onConfirm(target.id);
        onDone();
      }}
    >
      <h2 id={`${id}-title`} className="m-0 text-title">Xóa phiên chat?</h2>
      <p id={`${id}-desc`} className="mt-2 mb-0 text-sm text-menu-text-muted text-pretty">
        “{target?.topic}” và toàn bộ tin nhắn trong phiên sẽ bị xóa. Không thể hoàn tác.
      </p>
      <form method="dialog" className="mt-5 flex justify-end gap-2">
        <button value="cancel" className={secondary}>Hủy</button>
        <button value="delete" className={primary}>Xóa</button>
      </form>
    </dialog>
  );
}

// Đổi tên từ header (danh sách dùng ô nhập tại chỗ). onSave(id, tên mới) khi bấm Lưu / Enter.
export function RenameDialog({ target, onSave, onDone }) {
  const ref = useModal(target);
  const input = useRef(null);
  const id = useId();
  useEffect(() => {
    if (!target) return;
    input.current.value = target.topic;
    input.current.select();
  }, [target]);
  return (
    <dialog
      {...dialogProps(ref)}
      aria-labelledby={`${id}-title`}
      onClose={() => {
        const value = input.current.value.trim();
        if (ref.current.returnValue === "save" && target && value && value !== target.topic) onSave(target.id, value);
        onDone();
      }}
    >
      <h2 id={`${id}-title`} className="m-0 text-title">Đổi tên phiên chat</h2>
      <form method="dialog" className="mt-4">
        <label htmlFor={`${id}-input`} className="sr-only">Tên mới</label>
        <input
          ref={input}
          id={`${id}-input`}
          autoComplete="off"
          maxLength={120}
          className="block h-11 w-full rounded-xl border border-composer-border bg-menu-bg px-3 text-sm text-menu-text outline-none focus-visible:border-focus-ring focus-visible:ring-1 focus-visible:ring-focus-ring"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              ref.current.close("save");
            }
          }}
        />
        <div className="mt-5 flex justify-end gap-2">
          <button value="cancel" className={secondary}>Hủy</button>
          <button value="save" className={primary}>Lưu</button>
        </div>
      </form>
    </dialog>
  );
}
