"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [aiSuggestedWorkspace, setAiSuggestedWorkspace] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch("password");
  const name = watch("name");

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;

    setPasswordStrength(Math.min(strength, 100));
  }, [password]);

  // AI-generated workspace name suggestion
  useEffect(() => {
    if (name && name.length > 2) {
      // Simulate AI suggestion
      setTimeout(() => {
        const suggestions = [
          `${name}'s Workspace`,
          `${name} AI Studio`,
          `Team ${name}`,
          `${name} Labs`,
        ];
        setAiSuggestedWorkspace(
          suggestions[Math.floor(Math.random() * suggestions.length)],
        );
      }, 500);
    } else {
      setAiSuggestedWorkspace("");
    }
  }, [name]);

  const onSubmit = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      return;
    }
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Register:", data);
    setIsLoading(false);
  };

  const handleGoogleSignUp = () => {
    console.log("Google Sign Up");
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "bg-red-500";
    if (passwordStrength < 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 70) return "Medium";
    return "Strong";
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-500/20 rounded-xl mb-4">
          <Sparkles className="w-7 h-7 text-violet-400 animate-pulse" />
        </div>
        <h2 className="text-2xl text-white mb-2">Create your account</h2>
        <p className="text-slate-400">
          Join the AI-powered workspace revolution
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-slate-300">
            Full name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              className={`pl-10 bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 ${
                errors.name ? "border-red-500" : ""
              }`}
              {...register("name", {
                required: "Name is required",
                minLength: {
                  value: 2,
                  message: "Name must be at least 2 characters",
                },
              })}
            />
          </div>
          {errors.name && (
            <p className="text-xs text-red-400">{errors.name.message}</p>
          )}
          {aiSuggestedWorkspace && (
            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span className="text-violet-400">
                AI suggests: &quot;{aiSuggestedWorkspace}&quot;
              </span>
            </div>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-300">
            Email address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              className={`pl-10 bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 ${
                errors.email ? "border-red-500" : ""
              }`}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-300">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className={`pl-10 bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 ${
                errors.password ? "border-red-500" : ""
              }`}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          )}
          {password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Password strength
                </span>
                <span
                  className={`text-xs font-medium ${
                    passwordStrength < 40
                      ? "text-red-400"
                      : passwordStrength < 70
                        ? "text-amber-400"
                        : "text-emerald-400"
                  }`}
                >
                  {getPasswordStrengthText()}
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                  style={{ width: `${passwordStrength}%` }}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  {password.length >= 8 ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3 h-3 text-slate-600" />
                  )}
                  <span
                    className={
                      password.length >= 8
                        ? "text-emerald-400"
                        : "text-slate-500"
                    }
                  >
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {/[A-Z]/.test(password) && /[a-z]/.test(password) ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3 h-3 text-slate-600" />
                  )}
                  <span
                    className={
                      /[A-Z]/.test(password) && /[a-z]/.test(password)
                        ? "text-emerald-400"
                        : "text-slate-500"
                    }
                  >
                    Mixed case letters
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {/[0-9]/.test(password) ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3 h-3 text-slate-600" />
                  )}
                  <span
                    className={
                      /[0-9]/.test(password)
                        ? "text-emerald-400"
                        : "text-slate-500"
                    }
                  >
                    Contains a number
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-slate-300">
            Confirm password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className={`pl-10 bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 ${
                errors.confirmPassword ? "border-red-500" : ""
              }`}
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) =>
                  value === password || "Passwords do not match",
              })}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-300"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Create account
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900/50 px-2 text-slate-500">
              Or continue with
            </span>
          </div>
        </div>

        {/* Google Sign Up */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignUp}
          className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <svg
            viewBox="-0.5 0 48 48"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            fill="#000000"
            width="20"
            height="20"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              <title>Google-color</title>
              <desc>Created with Sketch.</desc>
              <defs></defs>
              <g
                id="Icons"
                stroke="none"
                strokeWidth="1"
                fill="none"
                fillRule="evenodd"
              >
                <g id="Color-" transform="translate(-401.000000, -860.000000)">
                  <g id="Google" transform="translate(401.000000, 860.000000)">
                    <path
                      d="M9.82727273,24 C9.82727273,22.4757333 10.0804318,21.0144 10.5322727,19.6437333 L2.62345455,13.6042667 C1.08206818,16.7338667 0.213636364,20.2602667 0.213636364,24 C0.213636364,27.7365333 1.081,31.2608 2.62025,34.3882667 L10.5247955,28.3370667 C10.0772273,26.9728 9.82727273,25.5168 9.82727273,24"
                      id="Fill-1"
                      fill="#FBBC05"
                    ></path>
                    <path
                      d="M23.7136364,10.1333333 C27.025,10.1333333 30.0159091,11.3066667 32.3659091,13.2266667 L39.2022727,6.4 C35.0363636,2.77333333 29.6954545,0.533333333 23.7136364,0.533333333 C14.4268636,0.533333333 6.44540909,5.84426667 2.62345455,13.6042667 L10.5322727,19.6437333 C12.3545909,14.112 17.5491591,10.1333333 23.7136364,10.1333333"
                      id="Fill-2"
                      fill="#EB4335"
                    ></path>
                    <path
                      d="M23.7136364,37.8666667 C17.5491591,37.8666667 12.3545909,33.888 10.5322727,28.3562667 L2.62345455,34.3946667 C6.44540909,42.1557333 14.4268636,47.4666667 23.7136364,47.4666667 C29.4455,47.4666667 34.9177955,45.4314667 39.0249545,41.6181333 L31.5177727,35.8144 C29.3995682,37.1488 26.7323182,37.8666667 23.7136364,37.8666667"
                      id="Fill-3"
                      fill="#34A853"
                    ></path>
                    <path
                      d="M46.1454545,24 C46.1454545,22.6133333 45.9318182,21.12 45.6113636,19.7333333 L23.7136364,19.7333333 L23.7136364,28.8 L36.3181818,28.8 C35.6879545,31.8912 33.9724545,34.2677333 31.5177727,35.8144 L39.0249545,41.6181333 C43.3393409,37.6138667 46.1454545,31.6490667 46.1454545,24"
                      id="Fill-4"
                      fill="#4285F4"
                    ></path>
                  </g>
                </g>
              </g>
            </g>
          </svg>
          Sign up with Google
        </Button>
      </form>

      {/* Sign In Link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-violet-400 hover:text-violet-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Terms */}
      <p className="mt-6 text-xs text-center text-slate-500">
        By creating an account, you agree to our{" "}
        <a href="#" className="text-violet-400 hover:text-violet-300">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="text-violet-400 hover:text-violet-300">
          Privacy Policy
        </a>
      </p>
    </div>
  );
}
