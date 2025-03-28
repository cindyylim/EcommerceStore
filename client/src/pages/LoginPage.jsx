import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LogIn, Mail, Lock, ArrowRight, Loader } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const {login, loading} = useUserStore();
  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password);
  };
  return (
    <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        className="sm:mx-auto sm:w-full sm:max-w-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
      </motion.div>
      <motion.div
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y 6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium"
              >
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="block w-full px-3 py-2 pl-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                  placeholder="you@example.com"
                ></input>
              </div>
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium"
              >
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  className="block w-full px-3 py-2 pl-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                  placeholder="********"
                ></input>
              </div>
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium  bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition duration-150 ease-in-out disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader
                    className="mr-2 h-5 w-5 animate-spin"
                    aria-hidden="true"
                  />{" "}
                  Loading...{" "}
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" aria-hidden="true" />
                  Login
                </>
              )}
            </button>
          </form>
          <p className="mt-8 text-center text-sm">
            Not a member?{" "}
            <Link
              to="/signup"
              className="font-medium text-yellow-400 hover:text-yellow-300"
            >
              Sign up now <ArrowRight className="inline h-4 w-4" />
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
