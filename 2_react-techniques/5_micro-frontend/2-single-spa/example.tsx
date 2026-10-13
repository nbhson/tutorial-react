import React from 'react';
import { createRoot } from 'react-dom/client';
import singleSpaReact from 'single-spa-react';

function ShopApp(props: { customProps?: { username?: string } }) {
  return <h1>Shop — chào {props.customProps?.username ?? 'khách'}</h1>;
}

// Lifecycles để root-config mount/unmount app theo route
const lifecycles = singleSpaReact({
  React,
  ReactDOMClient: { createRoot },
  rootComponent: ShopApp,
});

export const { bootstrap, mount, unmount } = lifecycles;
