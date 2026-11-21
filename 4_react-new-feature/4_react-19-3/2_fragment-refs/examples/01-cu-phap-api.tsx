import { Fragment, useRef, useEffect } from 'react';

function Group({ children, onClick }: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  const fragmentRef = useRef<React.ComponentRef<typeof Fragment>>(null);

  useEffect(() => {
    const instance = fragmentRef.current;
    if (!instance) return;
    instance.addEventListener('click', onClick);
    return () => instance.removeEventListener('click', onClick);
  }, [onClick]);

  // PHẢI dùng <Fragment> (không dùng <>...</>) khi truyền ref
  return <Fragment ref={fragmentRef}>{children}</Fragment>;
}
