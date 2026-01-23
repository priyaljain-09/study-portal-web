import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../redux/slices/applicationSlice';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Users } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../redux/store';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, successLogin, userRole } = useSelector((state: RootState) => state.applicationData);
  
  const [schoolCode, setSchoolCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (successLogin && userRole) {
      navigate('/dashboard', { replace: true });
    }
  }, [successLogin, userRole, navigate]);

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
        role: role, // Required field - must be "student" or "teacher"
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
              {/* Role Selection */}
              <div className="flex flex-col gap-2">
                <label htmlFor="role" className="text-sm font-medium text-gray-700">
                  Login As
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {role === 'teacher' ? (
                      <GraduationCap className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Users className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'teacher' | 'student')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white text-gray-900"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

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
