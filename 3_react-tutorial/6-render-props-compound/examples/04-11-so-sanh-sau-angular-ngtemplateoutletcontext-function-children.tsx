import { useId } from "react";

function AccessibleTabsDemo({ value }: { value: string }) {
  const base = useId(); // sinh id duy nhất cho cụm Tabs này, an toàn SSR
  const tabId = `${base}-tab-a`; // id cho nút tab A
  const panelId = `${base}-panel-a`; // id cho panel A, nối qua aria-controls
  return (
    <>
      {/* aria-selected báo tab nào đang active, aria-controls trỏ tới panel */}
      <button role="tab" id={tabId} aria-selected={value === "a"} aria-controls={panelId}>A</button>
      <p role="tabpanel" id={panelId} aria-labelledby={tabId}>Nội dung A</p>
    </>
  );
}
