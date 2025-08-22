// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { FiMail, FiEyeOff, FiUser } from "react-icons/fi";
// import villageIcon from "../images/multiico.png";
// import bgImage from "../images/multibg.png";
// import "../css/Login.css";

// export default function Login() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setError("");

//     try {
//       const res = await axios.post("http://localhost:5000/api/auth/login", {

//         email,
//         password,
//       });

//       console.log("✅ Login Response:", res.data); 
      
//       localStorage.setItem("userId", res.data.userId);
//       localStorage.setItem("name", res.data.name);
//       localStorage.setItem("email", res.data.email);
//       localStorage.setItem("role", res.data.role);
//       localStorage.setItem("contactNumber", res.data.contactNumber);
//       localStorage.setItem("address", res.data.address);
      

//       navigate("/dashboard");
//     } catch (err) {
//       setError(err.response?.data?.error || "Login failed.");
//     }
//   };

//   return (
//     <div className="w-screen h-screen flex items-center justify-center bg-gray-900">
//       <div className="flex w-full h-full bg-white shadow-lg rounded-none overflow-hidden">
//         {/* Left */}
//         <div
//           className="flex-1 bg-cover bg-center relative hidden md:flex"
//           style={{ backgroundImage: `url(${bgImage})` }}
//         >
//           {/* Left Panel */}
// <div className="login-left-panel hidden md:flex">
//   <img src={villageIcon} alt="Village Icon" className="village-icon" />
//   <h2 className="login-title">CommuniSafe</h2>
//   <p className="login-description">
//     Welcome back to CommuniSafe. Sign in to stay connected with your community.
//   </p>
// </div>

//         </div>

//         {/* Right */}
//         <div className="flex-1 flex items-center justify-center px-10 py-14">
//           <div className="w-full max-w-md text-center">
//             <h2 className="text-3xl font-extrabold text-black mb-1">Log in</h2>
//             <div className="w-16 h-1 bg-green-600 mx-auto mb-6 rounded-full" />
//             <div className="flex justify-center mb-8">
//               <FiUser size={72} className="text-black" />
//             </div>

//             <form onSubmit={handleLogin} className="space-y-6 text-left">
//               <div className="relative">
//                 <input
//                   type="text"
//                   placeholder="Email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                   className="w-full p-4 pr-12 text-base border border-gray-300 rounded-lg"
//                 />
//                 <FiMail className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
//               </div>

//               <div className="relative">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   placeholder="Password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   required
//                   className="w-full p-4 pr-12 text-base border border-gray-300 rounded-lg"
//                 />
//                 <FiEyeOff
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
//                 />
//               </div>

//               <div className="text-sm text-gray-600 px-1">
//                 <Link to="/forgot-password" className="text-green-600 hover:underline">
//                   Forgot Password?
//                 </Link>
//               </div>

//               <div className="text-center text-sm text-gray-600">
//                 <Link to="/signup" className="text-green-600 underline">
//                   Create your account here!
//                 </Link>
//               </div>

//               <button
//                 type="submit"
//                 className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-full"
//               >
//                 LOG IN
//               </button>
//               {error && <p className="text-red-600 mt-3 text-center">{error}</p>}
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiMail, FiEyeOff, FiUser } from "react-icons/fi";
import villageIcon from "../images/multiico.png";
import bgImage from "../images/multibg.png";
import "../css/Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Add API URL constant
  const API_URL = process.env.REACT_APP_API_URL || 'https://communisafe-backend.onrender.com';

  const handleLogin = async (e) => {
  e.preventDefault();
  setError("");

  try {
    const res = await axios.post(`${API_URL}/api/auth/login`, {
      identifier: email, // can be email or username
      password,
    });

      console.log("LOGIN RESPONSE DATA:", res.data);

localStorage.setItem("token", res.data.token);
localStorage.setItem("userId", res.data.userId);  // not res.data.user._id!
localStorage.setItem("name", res.data.name);
localStorage.setItem("email", res.data.email);
localStorage.setItem("role", res.data.role);
localStorage.setItem("contactNumber", res.data.contactNumber);
localStorage.setItem("address", res.data.address);
    // Role-based redirect
    const role = res.data.role;
    if (role === 'superadmin') {
      navigate('/superadmin/dashboard');
    } else if (role === 'official') {
      navigate('/dashboard');
    } else if (role === 'security') {
      navigate('/dashboard');
    } else {
      navigate('/dashboard'); // or '/home'
    }
  } catch (err) {
  console.log("❌ Login error:", err.response?.data || err);
  setError(err.response?.data?.error || "Login failed.");
}
};

return (
    <div className="w-screen h-screen flex items-center justify-center bg-gray-900">
      <div className="flex w-full h-full bg-white shadow-lg rounded-none overflow-hidden">
        {/* Left */}
        <div
          className="flex-1 bg-cover bg-center relative hidden md:flex"
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          {/* Left Panel */}
<div className="login-left-panel hidden md:flex">
  <img src={villageIcon} alt="Village Icon" className="village-icon" />
  <h2 className="login-title">CommuniSafe</h2>
  <p className="login-description">
    Welcome back to CommuniSafe. Sign in to stay connected with your community.
  </p>
</div>

        </div>

        {/* Right */}
        <div className="flex-1 flex items-center justify-center px-10 py-14">
          <div className="w-full max-w-md text-center">
            <h2 className="text-3xl font-extrabold text-black mb-1">Log in</h2>
            <div className="w-16 h-1 bg-green-600 mx-auto mb-6 rounded-full" />
            <div className="flex justify-center mb-8">
              <FiUser size={72} className="text-black" />
            </div>

            <form onSubmit={handleLogin} className="space-y-6 text-left">
              <div className="relative">
                <input
  type="text"
  placeholder="Email or Username"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
  className="w-full p-4 pr-12 text-base border border-gray-300 rounded-lg"
/>
                <FiMail className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-4 pr-12 text-base border border-gray-300 rounded-lg"
                />
                <FiEyeOff
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                />
              </div>

              <div className="text-sm text-gray-600 px-1">
                <Link to="/forgot-password" className="text-green-600 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <div className="text-center text-sm text-gray-600">
                <Link to="/signup" className="text-green-600 underline">
                  Create your account here!
                </Link>
              </div>

              <button
                type="submit"
                className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-full"
              >
                LOG IN
              </button>
              {error && <p className="text-red-600 mt-3 text-center">{error}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}