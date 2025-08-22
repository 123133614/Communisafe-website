import { useNavigate } from "react-router-dom";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-6 py-10 bg-white text-gray-800">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-green-700">Data Privacy Policy</h1>
        <p className="mb-4">
          CommuniSafe is committed to protecting your personal information in accordance with the Data Privacy Act of
          2012 (RA 10173) of the Philippines.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">1. Data Collection</h2>
        <p className="mb-4">
          We collect your name, email, role, and other community-related data solely for system functionality and safety
          monitoring.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">2. Data Usage</h2>
        <p className="mb-4">
          Collected data is used to manage accounts, verify visitors, track incidents, and provide secure communications.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">3. Data Protection</h2>
        <p className="mb-4">
          Your data is stored securely and will not be shared with unauthorized third parties.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">4. Your Rights</h2>
        <p className="mb-4">
          You may request access to, correction of, or deletion of your personal data by contacting our support team.
        </p>

        <p className="mt-6 text-sm text-gray-600">
          For privacy-related inquiries, email: <a href="mailto:privacy@communisafe.app" className="text-green-600 underline">privacy@communisafe.app</a>.
        </p>

    
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate("/login")}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 text-xs rounded-md shadow-sm transition"
          >
            Okay, I’ve read this — Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
