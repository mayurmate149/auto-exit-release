"use client";
export default function SignInForm() {
  const handleSSOLogin = () => {
    window.location.href = '/api/auth/5paisa/login';
  };

  const handleJournalLogin = () => {
    window.location.href = 'https://mayur-mate.vercel.app/';
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="flex flex-col items-center w-full gap-3">
            <button onClick={handleSSOLogin} className="w-full max-w-xs inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-white transition-colors bg-red-600 rounded-lg px-7 hover:bg-red-700 hover:text-white dark:bg-red-600 dark:text-white dark:hover:bg-red-700">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="4" fill="#ED1B2F"/>
                <path d="M7.5 7.5H16.5V16.5H7.5V7.5Z" fill="white"/>
                <path d="M9.5 9.5H14.5V14.5H9.5V9.5Z" fill="#ED1B2F"/>
              </svg>
              Sign in with 5paisa
            </button>
            <button onClick={handleJournalLogin} className="w-full max-w-xs inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-white transition-colors bg-indigo-600 rounded-lg px-7 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700">
              Login to trade journal
            </button>
          </div>
      </div>
    </div>
  );
}
