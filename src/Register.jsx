import { useState } from "react";
import axios from "axios";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      const res = await axios.post("https://4c6d5352154b.ngrok-free.app/register", {
        username,
        email,
        password
      });

      alert(res.data.message);

      if (res.data.status === "success") {
        window.location.href = "/login";
      }
    } catch (err) {
      alert("Registration failed! Check your server.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8">
        
        <h2 className="text-3xl font-bold text-center text-green-600 dark:text-green-400 mb-6">
          Create Account
        </h2>

        {/* Username */}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-1">
            Username
          </label>
          <input
            type="text"
            className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white 
            focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter username"
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white 
            focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            type="password"
            className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white 
            focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Register Button */}
        <button
          onClick={handleRegister}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold 
          shadow-md transition transform hover:scale-[1.02]"
        >
          Register
        </button>

        <p className="mt-4 text-center text-gray-600 dark:text-gray-300">
          Already have an account?{" "}
          <a href="/login" className="text-green-600 dark:text-green-400 font-semibold hover:underline">
            Login
          </a>
        </p>

      </div>
    </div>
  );
}
