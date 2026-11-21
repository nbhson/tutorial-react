// (a) Shorthand — KHÔNG nhận props (không key):
<>{children}</>

// (b) Dạng đầy đủ — NHẬN key (đặc biệt cần khi map list trả >1 element):
import { Fragment } from "react";
items.map((it) => (
  <Fragment key={it.id}>
    <div className="head">{it.title}</div>
    <div className="foot">{it.meta}</div>
  </Fragment>
));
