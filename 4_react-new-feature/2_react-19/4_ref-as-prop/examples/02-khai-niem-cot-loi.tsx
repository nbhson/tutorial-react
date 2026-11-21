  function MyInput({ ref, ...props }: PropsWithRef) {
    return <input ref={ref} {...props} />;
  }
