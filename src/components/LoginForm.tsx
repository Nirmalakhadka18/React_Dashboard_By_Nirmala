"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

interface LoginFormProps {
    onToggle: () => void;
    successMessage?: string;
}

export default function LoginForm({ onToggle, successMessage }: LoginFormProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlMessage = searchParams.get("message");
    const displayMessage = successMessage || urlMessage;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (res?.error) {
                setError("Invalid email or password");
            } else {
                router.push("/dashboard");
            }
        } catch (err) {
            setError("An error occurred");
        }
    };

    return (
        <div className="w-full max-w-md bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-100">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800 tracking-tight">Welcome Back</h2>
            {displayMessage && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6 text-center text-sm font-medium border border-green-100">
                    {displayMessage}
                </div>
            )}
            {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-center text-sm font-medium border border-red-100">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block mb-2 font-medium text-gray-700 text-sm">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="you@example.com"
                        required
                    />
                </div>
                <div>
                    <label className="block mb-2 font-medium text-gray-700 text-sm">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="••••••••"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] active:scale-100 shadow-lg"
                >
                    Login to Dashboard
                </button>
            </form>
            <p className="mt-6 text-center text-gray-600 text-sm">
                New here?{" "}
                <button onClick={onToggle} className="text-purple-600 hover:text-purple-800 font-semibold hover:underline transition-colors">
                    Create an account
                </button>
            </p>
        </div>
    );
}
