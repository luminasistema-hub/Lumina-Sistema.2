import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Church, ArrowLeft, Building, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import FormularioCadastroIgreja from '../components/FormularioCadastroIgreja';

const CadastrarIgrejaPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
              <img src="/favicon.ico" alt="Lumina Logo" className="w-10 h-10" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Lumina
            </CardTitle>
            <CardDescription className="text-base">
              Cadastre sua igreja e crie sua conta de administrador
            </CardDescription>
            <Badge className="bg-green-100 text-green-800 mx-auto">
              Sistema em Produção
            </Badge>
          </CardHeader>
          
          <CardContent>
            <FormularioCadastroIgreja />

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Já tenho conta - Fazer Login
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500 mt-6 bg-white/80 p-4 rounded-lg">
          <p className="flex items-center justify-center gap-2 mb-2">
            <img src="/favicon.ico" alt="Lumina Icon" className="w-4 h-4" />
            Lumina - Sistema de Gestão Eclesiástica
          </p>
          <p className="text-xs">
            Ao cadastrar sua igreja, você será o administrador principal.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CadastrarIgrejaPage;