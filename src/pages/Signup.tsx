import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Instagram, Heart, MessageSquare, Share2 } from 'lucide-react';
import VantaBackground from '@/components/VantaBackground';

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Check your email to confirm your account.');
      navigate('/login');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <VantaBackground />
      <Card className="w-full max-w-md glass border-white/20 dark:border-white/20 border-gray-200">
        <CardHeader className="text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <h1 className="text-4xl text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 gothic-cursive-font">
              WithAkashAgrawal
            </h1>
            <div className="flex items-center space-x-4">
              <Instagram className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <div className="flex space-x-2 text-gray-500 dark:text-gray-400">
                <Heart className="h-5 w-5" />
                <MessageSquare className="h-5 w-5" />
                <Share2 className="h-5 w-5" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-purple-600 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent gothic-glow">
              Get Started
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-white/70 mt-2">
              Create your account to start finding new leads.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-6">
            {message && <p className="text-sm text-red-500 text-center">{message}</p>}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-white/90">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass border-gray-300 dark:border-white/30 text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-white/90">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass border-gray-300 dark:border-white/30 text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-medium py-2.5"
              disabled={loading}
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </Button>
          </form>

          <p className="text-sm text-center text-gray-600 dark:text-white/70 mt-4">
            Already have an account?{' '}
            <a href="/login" className="text-blue-500 hover:underline">
              Log in
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
