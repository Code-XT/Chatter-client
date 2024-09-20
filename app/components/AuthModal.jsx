"use client";
import React, { useState, useEffect } from "react";
import { FaGoogle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const AuthModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) setEmail(storedEmail);
  }, []);

  const validateInputs = () => {
    const newErrors = {};
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (isSignUp && password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateInputs()) {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      localStorage.setItem("userEmail", email);
      setIsLoading(false);
      setIsOpen(false);
      // Here you would typically handle the sign-in/sign-up logic
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } },
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
        aria-label="Open authentication modal"
      >
        Sign In / Sign Up
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none"
          >
            <div className="relative w-full max-w-md mx-auto my-6">
              <div className="relative flex flex-col w-full bg-gray-800 border-0 rounded-lg shadow-lg outline-none focus:outline-none">
                <div className="flex items-start justify-between p-5 border-b border-solid rounded-t border-gray-700">
                  <h3 className="text-2xl font-semibold text-white">
                    {isSignUp ? "Sign Up" : "Sign In"}
                  </h3>
                  <button
                    className="p-1 ml-auto bg-transparent border-0 text-gray-400 float-right text-3xl leading-none font-semibold outline-none focus:outline-none hover:text-white transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close modal"
                  >
                    <span className="h-6 w-6 text-2xl block outline-none focus:outline-none">
                      ×
                    </span>
                  </button>
                </div>
                <div className="relative p-6 flex-auto">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="email"
                        className="block mb-2 text-sm font-medium text-gray-300"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your email"
                        aria-invalid={errors.email ? "true" : "false"}
                        aria-describedby={
                          errors.email ? "email-error" : undefined
                        }
                      />
                      {errors.email && (
                        <p
                          id="email-error"
                          className="mt-2 text-sm text-red-500"
                        >
                          {errors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="password"
                        className="block mb-2 text-sm font-medium text-gray-300"
                      >
                        Password
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 text-sm text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your password"
                        aria-invalid={errors.password ? "true" : "false"}
                        aria-describedby={
                          errors.password ? "password-error" : undefined
                        }
                      />
                      {errors.password && (
                        <p
                          id="password-error"
                          className="mt-2 text-sm text-red-500"
                        >
                          {errors.password}
                        </p>
                      )}
                    </div>
                    {isSignUp && (
                      <div>
                        <label
                          htmlFor="confirmPassword"
                          className="block mb-2 text-sm font-medium text-gray-300"
                        >
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 text-sm text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Confirm your password"
                          aria-invalid={
                            errors.confirmPassword ? "true" : "false"
                          }
                          aria-describedby={
                            errors.confirmPassword
                              ? "confirm-password-error"
                              : undefined
                          }
                        />
                        {errors.confirmPassword && (
                          <p
                            id="confirm-password-error"
                            className="mt-2 text-sm text-red-500"
                          >
                            {errors.confirmPassword}
                          </p>
                        )}
                      </div>
                    )}
                    <div>
                      <button
                        className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
                        type="submit"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <svg
                            className="w-5 h-5 mx-auto text-white animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        ) : isSignUp ? (
                          "Sign Up"
                        ) : (
                          "Sign In"
                        )}
                      </button>
                    </div>
                  </form>
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-sm text-blue-400 hover:text-blue-300 focus:outline-none"
                    >
                      {isSignUp
                        ? "Already have an account? Sign In"
                        : "Don't have an account? Sign Up"}
                    </button>
                  </div>
                  <div className="flex items-center justify-between my-4">
                    <hr className="w-full border-gray-600" />
                    <span className="px-2 text-gray-400">OR</span>
                    <hr className="w-full border-gray-600" />
                  </div>
                  <div>
                    <button className="flex items-center justify-center w-full px-4 py-2 space-x-2 transition-colors duration-300 border border-gray-600 rounded-lg group hover:bg-gray-700 focus:outline-none">
                      <span>
                        <FaGoogle className="w-5 h-5 text-gray-300 fill-current group-hover:text-white" />
                      </span>
                      <span className="text-sm font-medium text-gray-300 group-hover:text-white">
                        Sign in with Google
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {isOpen && <div className="fixed inset-0 z-40 bg-black opacity-50"></div>}
    </div>
  );
};

export default AuthModal;
