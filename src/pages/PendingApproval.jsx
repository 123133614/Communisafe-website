import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; // 🟩 Add Link
import { MdPerson, MdVerifiedUser } from "react-icons/md";

export default function PendingApproval() {
  const navigate = useNavigate();



  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="text-green-600 text-2xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 inline-block"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M3 12l9-9 9 9h-3v9H6v-9H3z" />
            </svg>
          </div>
          <span className="text-green-600 font-bold text-lg">CommuniSafe</span>
        </div>
        <div className="flex gap-6 text-sm text-gray-600">
          <Link to="/signup" className="hover:underline cursor-pointer">Sign up</Link> {/* 🟩 */}
          <Link to="/login" className="hover:underline cursor-pointer">Log in</Link>   {/* 🟩 */}
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-6">
        <div className="text-green-500 mb-6">
          <MdPerson size={96} className="inline-block" />
          <MdVerifiedUser size={48} className="inline-block ml-2" />
        </div>

        <p className="text-gray-700 text-lg font-medium mb-1">
          Your account is pending approval.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          You will receive a notification once verified.
        </p>

        {/* Spinner */}
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-10 w-10 mb-2 border-t-green-500 animate-spin"></div>
        <p className="text-sm text-gray-400">Loading your dashboard...</p>
      </main>
    </div>
  );
}
