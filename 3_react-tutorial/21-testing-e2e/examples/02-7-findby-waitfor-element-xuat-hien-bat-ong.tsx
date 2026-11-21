// Minh họa ý tưởng: chờ tên user sau fetch (không sleep cứng)
// import { render, screen } from "@testing-library/react";
// render(<UserCard />); // mount xong, fetch đang bay, tên chưa có
// expect(await screen.findByText("Son Nguyen")).toBeInTheDocument(); // poll tới khi hiện
// Cơ chế: findBy = getBy + retry async, về sớm thì pass sớm, không chờ thừa
