import AnimatedBackground from '../assets/AnimatedBackground';
import Login from './Login';

const Index = () => {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Animated Background */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative bg-login-gradient overflow-hidden">
        <AnimatedBackground />
        
        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            Unlock Your
            <br />
            <span className="text-login-dot">Learning Potential</span>
          </h2>
          <p className="text-lg text-white/70 max-w-md leading-relaxed">
            Access your courses, track your progress, and connect with your educational community all in one place.
          </p>
          
          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 mt-8">
            {['Interactive Courses', 'Progress Tracking', 'Community'].map((feature) => (
              <span
                key={feature}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/90 border border-white/20"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8 bg-background">
        <Login />
      </div>
    </div>
  );
};

export default Index;
