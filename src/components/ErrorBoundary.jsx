import { Component } from "react";

/**
 * Catches render/lifecycle exceptions in its subtree and shows a recoverable
 * card instead of leaving the rest of the page blank. React error boundaries
 * must be class components — there is no hook equivalent.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(`ErrorBoundary(${this.props.label || "app"}):`, error, info);
  }

  reset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const language = this.props.language || "zh";
    const t = (zh, en) => (language === "zh" ? zh : en);

    return (
      <div className="bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900/40 rounded-xl p-6 text-center m-4">
        <p className="text-2xl mb-2">⚠️</p>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
          {t("这部分内容出错了", "Something went wrong in this section")}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          {t("其余页面不受影响，可以重试或刷新页面。", "The rest of the page is unaffected — you can retry or refresh.")}
        </p>
        <button
          onClick={this.reset}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          {t("重试", "Retry")}
        </button>
      </div>
    );
  }
}
