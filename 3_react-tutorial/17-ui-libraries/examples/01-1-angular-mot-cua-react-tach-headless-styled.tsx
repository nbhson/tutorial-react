// Headless Radix: chỉ hành vi + a11y, class do bạn (Tailwind) quyết
import * as Dialog from "@radix-ui/react-dialog";
<Dialog.Root><Dialog.Trigger className="btn">Mở</Dialog.Trigger><Dialog.Content className="panel">Hi</Dialog.Content></Dialog.Root>
// Radix lo focus trap + ESC + aria-modal; bạn lo .btn/.panel đẹp kiểu nào cũng được
