// root-config.ts — orchestrator: chỉ điều phối, không biết chi tiết UI
import { registerApplication, start } from 'single-spa';
import { constructRoutes, constructApplications, constructLayoutEngine } from 'single-spa-layout';

// Layout với slot cho từng app (template lấy từ index.html)
// Vì sao từ template: slot khai báo một nơi, thêm app mới chỉ thêm slot + bundle, không sửa code điều phối
const routes = constructRoutes(document.querySelector('#single-spa-template')!);
const apps = constructApplications({
  routes,
  loadApp: ({ name }) => import(/* @vite-ignore */ name), // nạp bundle qua import map đã khai (@vite-ignore để Vite không bundle lúc build root)
});
const layoutEngine = constructLayoutEngine({ routes, apps }); // chèn app vào slot theo route

apps.forEach((app) => registerApplication(app)); // đăng ký hàng loạt từ template — không liệt kê tay từng app

// Sau khi đã đăng ký xong mới cho phép app mount — gọi sớm là mount vào slot chưa có
start();
