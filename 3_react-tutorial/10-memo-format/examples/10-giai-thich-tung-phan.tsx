const Row = memo(function Row({ text }: { text: string }) {
  return <li>{text}</li>;
});
