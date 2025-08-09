import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Input } from '../components/ui/input-enhanced';
import { Button } from '../components/ui/button-enhanced';
import { useToast } from '../hooks/use-toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    // Simulate authentication
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });
      navigate('/dashboard');
    }, 1500);
  };

  const handleGoogleLogin = () => {
    toast({
      title: "Google OAuth",
      description: "Google authentication would be integrated here.",
    });
  };

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Sign in to access your PDF insights"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<FiMail size={18} />}
            error={errors.email}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<FiLock size={18} />}
              error={errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-vectra-text-secondary hover:text-vectra-text-primary transition-colors"
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex items-center justify-between text-sm"
        >
          <label className="flex items-center text-vectra-text-secondary">
            <input type="checkbox" className="mr-2 rounded" />
            Remember me
          </label>
          <Link 
            to="/forgot-password" 
            className="text-primary hover:text-primary/80 link-underline"
          >
            Forgot password?
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="space-y-4"
        >
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
          >
            Sign In
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-vectra-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-vectra-dark px-4 text-vectra-text-secondary">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="google"
            size="lg"
            className="w-full"
            onClick={handleGoogleLogin}
            icon={<FcGoogle size={20} />}
          >
            Continue with Google
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-center text-sm text-vectra-text-secondary"
        >
          Don't have an account?{' '}
          <Link 
            to="/signup" 
            className="text-primary hover:text-primary/80 link-underline font-medium"
          >
            Sign up
          </Link>
        </motion.div>
      </form>
    </AuthLayout>
  );
};

export default Login;