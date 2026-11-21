  const MyInput = forwardRef<HTMLInputElement, Props>((props, ref) => {
    return <input ref={ref} {...props} />;
  });
