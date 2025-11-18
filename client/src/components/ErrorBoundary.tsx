import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ Error caught by ErrorBoundary:', error);
    console.error('❌ Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full border border-red-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-500"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">Ошибка загрузки</h2>
            </div>
            
            <p className="text-gray-400 mb-4">
              Произошла ошибка при загрузке приложения. Пожалуйста, попробуйте обновить страницу.
            </p>
            
            {this.state.error && (
              <div className="mb-4 p-3 bg-black/50 rounded text-xs text-gray-500 font-mono overflow-auto max-h-32">
                <div className="text-red-400 mb-1">Ошибка:</div>
                <div>{this.state.error.message}</div>
                {this.state.errorInfo && (
                  <div className="mt-2 text-gray-600">
                    {this.state.errorInfo.componentStack.split('\n').slice(0, 3).join('\n')}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Обновить страницу
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Попробовать снова
              </button>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              <p>Если проблема сохраняется:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Проверьте подключение к интернету</li>
                <li>Проверьте, что сервер работает</li>
                <li>Откройте консоль браузера (F12) для деталей</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

