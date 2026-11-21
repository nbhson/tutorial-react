// ✅ ĐÚNG: để lib lo root + unmount + errorBoundary
const lifecycles = singleSpaReact({ React, ReactDOMClient: { createRoot }, rootComponent: ShopApp });
export const { bootstrap, mount, unmount } = lifecycles;
