"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center text-center gap-8 px-4 bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-2">
              <svg className="w-14 h-14 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-6xl font-bold text-gray-800">500</h1>
            <h2 className="text-2xl font-semibold text-gray-700">Критическая ошибка</h2>
            <p className="text-lg text-gray-500 max-w-md">
              Произошла критическая ошибка приложения. Попробуйте обновить страницу.
            </p>
            <details className="mt-4 text-left max-w-md">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                Детали ошибки
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          </div>
          <div className="flex gap-4 mt-6">
            <button
              onClick={reset}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow"
            >
              Попробовать снова
            </button>
            <button
              onClick={() => (window.location.href = '/items')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors shadow"
            >
              На главную
            </button>
          </div>
        </div>
      </body>
    </html>
  );
} 