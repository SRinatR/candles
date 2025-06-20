'use client';

import { useState, useEffect } from 'react';
import { signIn, signOut, getSession, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';
import { useToast } from '@/hooks/use-toast';

export default function AdminSignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Проверяем статус сессии и роль пользователя
    if (status === 'authenticated' && session?.user) {
      // Проверяем роль пользователя
      if (session.user.role === 'ADMIN' || session.user.role === 'MANAGER') {
        router.push('/admin/dashboard');
      } else {
        setError('У вас нет прав доступа к админ-панели');
        signOut({ redirect: false }); // Выходим, если нет прав
      }
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Используем signIn из next-auth/react для аутентификации
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Неверный email или пароль');
        toast({
          title: 'Ошибка входа',
          description: 'Проверьте правильность введенных данных',
          variant: 'destructive',
        });
      } else {
        // Проверяем сессию после успешного входа
        const newSession = await getSession();
        if (newSession?.user?.role === 'ADMIN' || newSession?.user?.role === 'MANAGER') {
          toast({
            title: 'Успешный вход',
            description: `Добро пожаловать, ${newSession.user.name}!`,
          });
          router.push('/admin/dashboard');
        } else {
          setError('У вас нет прав доступа к админ-панели');
          await signOut({ redirect: false });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Произошла ошибка при входе');
    } finally {
      setIsLoading(false);
    }
  };

  // Показываем индикатор загрузки, пока проверяем сессию
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <Logo className="h-8 w-8" />
              <ShieldCheck className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Админ-панель</CardTitle>
            <CardDescription>
              Вход для администраторов и менеджеров
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@askim.uz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Вход...
                </>
              ) : (
                'Войти'
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600">
            <p className="font-medium">Тестовые аккаунты:</p>
            <div className="mt-2 space-y-1 text-xs">
              <p><strong>Админ:</strong> admin@askimcandles.com / adminpass</p>
              <p><strong>Менеджер:</strong> manager@askimcandles.com / managerpass</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}