import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Este e-mail já está cadastrado com outra senha.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'E-mail ou senha incorretos.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas falhas. O acesso foi bloqueado temporariamente. Tente novamente mais tarde ou redefina sua senha.';
      default:
        return 'Ocorreu um erro de autenticação. Tente novamente.';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Por favor, digite seu e-mail no campo acima para redefinir a senha.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      alert('E-mail de redefinição de senha enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    setError('');
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, 'thiago@kravmaga.org.br', 'fikm2020');
      navigate('/admin');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        try {
          await signInWithEmailAndPassword(auth, 'thiago@kravmaga.org.br', 'fikm2020');
          navigate('/admin');
        } catch (signInErr: any) {
          if (signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/wrong-password') {
            setError('A conta thiago@kravmaga.org.br já existe, mas a senha foi alterada e não é mais "fikm2020". Por favor, preencha o e-mail acima e clique em "Esqueceu a senha?" para criar uma nova.');
            setEmail('thiago@kravmaga.org.br');
          } else {
            setError(getErrorMessage(signInErr.code));
          }
        }
      } else {
        setError(getErrorMessage(err.code));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-fikm-blue rounded-lg flex items-center justify-center text-white font-display text-4xl shadow-lg">
            F
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-display text-gray-900">
          Convênios FIKM
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Acesso Administrativo
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-fikm-blue focus:border-fikm-blue sm:text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <div className="text-sm">
                  <button type="button" onClick={handleResetPassword} className="font-medium text-fikm-blue hover:text-blue-800">
                    Esqueceu a senha?
                  </button>
                </div>
              </div>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-fikm-blue focus:border-fikm-blue sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-fikm-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fikm-blue disabled:opacity-50 transition-colors"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou</span>
              </div>
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleCreateAdmin}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fikm-blue transition-colors disabled:opacity-50"
              >
                Criar/Entrar como thiago@kravmaga.org.br
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
