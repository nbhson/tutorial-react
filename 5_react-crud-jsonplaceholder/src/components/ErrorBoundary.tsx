// Error Boundary 3 tầng (nhóm 8_best-practices): bắt lỗi render toàn route,
// hiện fallback thân thiện thay vì trắng trang. Class component là cách duy
// nhất làm boundary (function + hook không bắt được lỗi render).

import { Component } from "react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  message: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { message: null };

  static getDerivedStateFromError(err: unknown): State {
    return { message: err instanceof Error ? err.message : String(err) };
  }

  componentDidCatch(err: unknown): void {
    // Prod: gửi về logging service. Demo: log console.
    console.error("[ErrorBoundary]", err);
  }

  render(): ReactNode {
    if (this.state.message) {
      return (
        <main className="container">
          <h1>Có lỗi xảy ra</h1>
          <p className="error-box" role="alert">
            {this.state.message}
          </p>
          <button onClick={() => this.setState({ message: null })}>Thử lại</button>
        </main>
      );
    }
    return this.props.children;
  }
}
