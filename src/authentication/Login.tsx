import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../redux/slices/applicationSlice';
import { GraduationCap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../redux/store';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

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
    <div className="h-full w-full flex items-center justify-center">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm font-medium">Signing you in...</p>
        </div>
      ) : (
        <div className="w-[33%] flex justify-center items-center flex-col gap-8">
          {/* Brand Name */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcone Back</h1>
            <p className="text-[#727B8D] font-semibold text-lg">Sign in to your learning journey</p>
          </div>

          {/* Login Form */}
          <div className="w-full flex flex-col gap-2 p-4">
            <form onSubmit={handleLogin} className="w-full flex-col gap-4 flex">
              {/* School Code */}
              <Input
                id="schoolCode"
                type="text"
                label="School Code"
                icon={GraduationCap}
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                placeholder="School Code"
                autoCapitalize="none"
                autoCorrect="off"
                containerClassName="flex flex-col gap-2"
              />

              {/* Email Input */}
              <Input
                id="email"
                type="email"
                label="Email"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                autoCapitalize="none"
                autoCorrect="off"
                required
                containerClassName="flex flex-col gap-2"
              />

              {/* Password Input */}
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                icon={Lock}
                iconPosition="left"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                 containerClassName="flex flex-col gap-2"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <Eye className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                    )}
                  </button>
                }
              />

              {/* Log in Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                isLoading={isLoading || isSubmitting}
                className="mt-6"
              >
                {isLoading || isSubmitting ? 'Signing in...' : 'Log in'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
