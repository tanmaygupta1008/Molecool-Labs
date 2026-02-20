'use client';
// src/app/login/page.jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

const FIREBASE_MESSAGES = {
    'auth/email-already-in-use': 'This email is already registered. Try signing in.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/operation-not-allowed': 'Email/Password sign-in is not enabled. Please enable it in Firebase Console → Authentication → Sign-in method.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/configuration-not-found': 'Firebase is not configured correctly. Check your .env.local file.',
    'auth/invalid-api-key': 'Invalid Firebase API key. Check your .env.local file.',
};

function getErrorMsg(err) {
    console.error('[Auth Error]', err.code, err.message);
    return FIREBASE_MESSAGES[err.code] ?? `Error (${err.code ?? 'unknown'}): ${err.message}`;
}

export default function LoginPage() {
    const { user, loading, login, register, resetPassword } = useAuth();
    const router = useRouter();

    const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!loading && user) router.replace('/');
    }, [user, loading, router]);

    const clearMessages = () => { setError(''); setInfo(''); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearMessages();

        if (mode === 'signup' && password !== confirm) {
            setError('Passwords do not match.');
            return;
        }

        setBusy(true);
        try {
            if (mode === 'signin') {
                await login(email, password);
            } else if (mode === 'signup') {
                await register(email, password, name.trim() || undefined);
            } else {
                await resetPassword(email);
                setInfo('Password reset email sent! Check your inbox.');
                setMode('signin');
            }
        } catch (err) {
            setError(getErrorMsg(err));
        } finally {
            setBusy(false);
        }
    };

    const switchMode = (next) => {
        clearMessages();
        setPassword('');
        setConfirm('');
        setMode(next);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const titles = {
        signin: { heading: 'Welcome back', sub: 'Sign in to your Molecool Labs account' },
        signup: { heading: 'Create account', sub: 'Join Molecool Labs and start experimenting' },
        reset: { heading: 'Reset password', sub: "We'll email you a reset link" },
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative">

            {/* Animated background blobs */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600 opacity-20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600 opacity-20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

            {/* Card */}
            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="bg-gray-900/80 backdrop-blur-xl border border-cyan-800/50 rounded-3xl shadow-2xl shadow-cyan-900/30 p-10">

                    {/* Logo */}
                    <div className="flex flex-col items-center gap-2 mb-8">
                        <span className="text-5xl">🧪</span>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">
                            Molecool<span className="text-cyan-400"> Labs</span>
                        </h1>
                        <p className="text-gray-400 text-sm text-center">{titles[mode].sub}</p>
                    </div>

                    {/* Mode tabs (only signin / signup) */}
                    {mode !== 'reset' && (
                        <div className="flex bg-gray-800 rounded-xl p-1 mb-7 text-sm font-semibold">
                            {['signin', 'signup'].map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => switchMode(m)}
                                    className={`flex-1 py-2 rounded-lg transition-all duration-200 ${mode === m
                                        ? 'bg-cyan-600 text-white shadow'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {m === 'signin' ? 'Sign In' : 'Sign Up'}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                        {/* Name (signup only) */}
                        {mode === 'signup' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ada Lovelace"
                                    className="bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all duration-150 placeholder:text-gray-600"
                                />
                            </div>
                        )}

                        {/* Email */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all duration-150 placeholder:text-gray-600"
                            />
                        </div>

                        {/* Password (not on reset) */}
                        {mode !== 'reset' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 pr-12 text-white text-sm outline-none transition-all duration-150 placeholder:text-gray-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-lg leading-none select-none"
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPw ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Confirm password (signup only) */}
                        {mode === 'signup' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Confirm Password</label>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    required
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    placeholder="••••••••"
                                    className="bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all duration-150 placeholder:text-gray-600"
                                />
                            </div>
                        )}

                        {/* Forgot password link (signin only) */}
                        {mode === 'signin' && (
                            <div className="text-right -mt-1">
                                <button
                                    type="button"
                                    onClick={() => switchMode('reset')}
                                    className="text-xs text-cyan-500 hover:text-cyan-300 transition-colors duration-150"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {/* Error / Info messages */}
                        {error && (
                            <div className="flex items-start gap-2 bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 text-sm text-red-300">
                                <span className="shrink-0 mt-0.5">⚠️</span>
                                {error}
                            </div>
                        )}
                        {info && (
                            <div className="flex items-start gap-2 bg-green-900/30 border border-green-700/50 rounded-xl px-4 py-3 text-sm text-green-300">
                                <span className="shrink-0 mt-0.5">✅</span>
                                {info}
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={busy}
                            className="mt-1 w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm active:scale-95 transition-all duration-150 shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2"
                        >
                            {busy && (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            )}
                            {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                        </button>

                        {/* Back link for reset mode */}
                        {mode === 'reset' && (
                            <button
                                type="button"
                                onClick={() => switchMode('signin')}
                                className="text-sm text-gray-400 hover:text-white text-center transition-colors duration-150"
                            >
                                ← Back to Sign In
                            </button>
                        )}
                    </form>

                </div>
            </div>
        </div>
    );
}
