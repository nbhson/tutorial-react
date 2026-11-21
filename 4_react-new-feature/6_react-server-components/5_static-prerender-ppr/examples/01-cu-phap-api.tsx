// react-dom/static — prerender lúc build (SSG, CI, email HTML...)
import { prerender } from "react-dom/static";

async function buildStaticPage() {
  const { prelude } = await prerender(<App url="/" />);
  // `prelude`: ReadableStream chứa shell hoàn chỉnh + các hole đã settle
  for await (const chunk of prelude) process.stdout.write(String(chunk));
}
