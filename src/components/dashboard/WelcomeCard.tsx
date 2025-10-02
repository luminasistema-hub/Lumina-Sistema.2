import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';

const WelcomeCard = () => {
  const { user } = useAuthStore();
  const [churchName, setChurchName] = useState('');

  useEffect(() => {
    setChurchName(user?.churchName || '');
  }, [user?.churchName]);

  if (!user) return null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">
        {getGreeting()}, {user.name}! 👋
      </h1>
      <p className="text-blue-100 text-base md:text-lg">
        Bem-vindo ao seu painel de controle da Lumina
      </p>
      {churchName && (
        <p className="text-blue-200 mt-2 text-sm md:text-base">
          📍 {churchName}
          {user.ministry && ` • ${user.ministry}`}
        </p>
      )}
    </div>
  );
};

export default WelcomeCard;