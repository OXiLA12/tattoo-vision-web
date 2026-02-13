import { useState } from 'react';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthProps {
    onSuccess: (isNewUser?: boolean) => void;
}

export default function Auth({ onSuccess }: AuthProps) {
    const { signUp, signIn } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await signUp(email, password, fullName);
                if (error) throw error;
            } else {
                const { error } = await signIn(email, password);
                if (error) throw error;
            }

            onSuccess(isSignUp);
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Minimalist Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-[#0A0A0A] to-[#0A0A0A]" />

            {/* Main content */}
            <div className="relative z-10 w-full max-w-[380px]">
                {/* Title */}
                <div className="text-center mb-10 opacity-0 animate-fade-up">
                    <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">
                        {isSignUp ? 'Create account' : 'Welcome back'}
                    </h1>
                    <p className="text-neutral-400 text-sm">
                        {isSignUp ? 'Enter your details to get started.' : 'Enter your credentials to access your account.'}
                    </p>
                </div>

                {/* Form */}
                <div className="opacity-0 animate-fade-up animation-delay-100">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Error message */}
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <p className="text-red-500 text-xs font-medium">{error}</p>
                            </div>
                        )}

                        {/* Full Name (Sign Up only) */}
                        {isSignUp && (
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-neutral-400">
                                    Full Name
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-neutral-500 group-focus-within:text-white transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 bg-[#171717] border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                                        placeholder="John Doe"
                                        required={isSignUp}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-neutral-400">
                                Email address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-neutral-500 group-focus-within:text-white transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 bg-[#171717] border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-neutral-400">
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-neutral-500 group-focus-within:text-white transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 bg-[#171717] border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-white hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <span>{isSignUp ? 'Create account' : 'Sign in'}</span>
                            )}
                        </button>
                    </form>

                    {/* Toggle sign up/sign in */}
                    <div className="mt-8 text-center text-sm">
                        <span className="text-neutral-500">
                            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                        </span>
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(null);
                            }}
                            className="font-medium text-white hover:underline transition-all"
                        >
                            {isSignUp ? 'Sign in' : 'Sign up'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
