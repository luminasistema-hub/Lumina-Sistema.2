import React, { useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { supabase } from "../lib/supabaseClient"; // seu client do supabase

const FormularioCadastroIgreja = () => {
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    email: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase.from("igrejas").insert([
        {
          nome: formData.nome,
          cnpj: formData.cnpj,
          email: formData.email,
        },
      ]);

      if (error) {
        console.error(error);
        toast.error(`Erro no cadastro: ${error.message}`);
      } else {
        toast.success("Igreja cadastrada com sucesso!");
        setFormData({ nome: "", cnpj: "", email: "" });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro inesperado ao cadastrar.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome da Igreja</Label>
        <Input
          id="nome"
          name="nome"
          value={formData.nome}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="cnpj">CNPJ</Label>
        <Input
          id="cnpj"
          name="cnpj"
          value={formData.cnpj}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <Button type="submit" className="w-full">
        Cadastrar Igreja
      </Button>
    </form>
  );
};

export default FormularioCadastroIgreja;
