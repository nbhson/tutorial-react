import { use } from 'react';
import { browser } from 'react-dom'; // chú ý: react-dom, KHÔNG phải react

function BrowserOnly() {
  use(browser('Component này cần API của browser.'));
  return <BrowserContent />;
}
