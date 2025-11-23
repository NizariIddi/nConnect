import { useState } from "react";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/login", {
        email,
        password,
      });

      if (res.data.status === "success") {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        window.location.href = "/contacts";
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Login failed. Check your internet or server.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8">
        
        <h2 className="text-3xl font-bold text-center text-green-600 dark:text-green-400 mb-6">
          Welcome Back
        </h2>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter your email"
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
            className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold shadow-md transition transform hover:scale-[1.02]"
        >
          Login
        </button>
        
        <p className="mt-4 text-center text-gray-600 dark:text-gray-300">
          You dont have account?{" "}
          <a href="/register" className="text-green-600 dark:text-green-400 font-semibold hover:underline">
            Register here
          </a>
        </p>
        
      </div>
    </div>
  );
}
