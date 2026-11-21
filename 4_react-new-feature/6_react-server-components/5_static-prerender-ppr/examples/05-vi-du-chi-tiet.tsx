// react-dom/static (build script thuần — ngoài Next)
import { prerender } from "react-dom/static";
import { ProductPage } from "./app/product/page";

const { prelude } = await prerender(<ProductPage slug="ao-thun" />, {
  bootstrapScripts: ["/main.js"],
});
for await (const chunk of prelude) fs.writeSync(1, chunk); // HTML hoàn chỉnh cho SSG
