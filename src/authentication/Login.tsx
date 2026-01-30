import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../redux/slices/applicationSlice';
import { GraduationCap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../redux/store';
import Label from '../components/ui/Label';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, successLogin } = useSelector((state: RootState) => state.applicationData);
  
  const [schoolCode, setSchoolCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (successLogin) {
      navigate('/dashboard', { replace: true });
    }
  }, [successLogin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent double submission
    if (isSubmitting || isLoading) {
      return;
    }
    
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await dispatch(login({
        school_code: schoolCode || "1e827e31-d0ec-4561-9ec1-abd9b0523e6f",
        email: email.trim(),
        password: password.trim(),
      }));
    } catch (error: any) {
      // Error is handled by the slice's setShowToast action
      console.error('Login failed in component:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#043276]/10 mb-6">
          <GraduationCap className="w-8 h-8 text-[#043276]" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
        <p className="text-muted-foreground">Sign in to your learning journey</p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-5">
        {/* School Code */}
        <div className="space-y-2">
          <Label htmlFor="schoolCode" className="text-sm font-medium text-foreground">
            School Code
          </Label>
          <div className="relative">
            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              id="schoolCode"
              type="text"
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value)}
              placeholder="Enter your school code"
              className="w-full pl-11 h-12 bg-input-bg border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:border-[#043276] focus:ring-[#043276]/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full pl-11 h-12 bg-input-bg border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:border-[#043276] focus:ring-[#043276]/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full pl-11 pr-11 h-12 bg-input-bg border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:border-[#043276] focus:ring-[#043276]/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-md transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
              ) : (
                <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
              )}
            </button>
          </div>
        </div>

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <button
            type="button"
            className="text-sm text-[#043276] hover:text-[#043276]/80 font-medium transition-colors"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="w-full h-12 text-base font-semibold bg-[#043276] hover:bg-[#043276]/90 text-white shadow-lg shadow-[#043276]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#043276]/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 rounded-lg flex items-center justify-center"
        >
          {isSubmitting || isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-[#043276]-foreground/30 border-t-[#043276]-foreground rounded-full animate-spin" />
              Signing in...
            </div>
          ) : (
            'Log in'
          )}
        </button>
      </form>
    </div>
  );
};

export default Login;
