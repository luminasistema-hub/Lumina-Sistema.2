import React from 'react';

interface DescricaoFormatadaProps {
  texto: string;
}

const DescricaoFormatada: React.FC<DescricaoFormatadaProps> = ({ texto }) => {
  if (!texto) return null;

  const formatarLinha = (linha: string) => {
    if (linha.includes('**Marcos:**')) {
      return `📍 ${linha.replace('**Marcos:**', 'Marcos:')}`;
    }
    if (linha.includes('**Objetivos:**')) {
      return `🎯 ${linha.replace('**Objetivos:**', 'Objetivos:')}`;
    }
    if (linha.includes('**Ferramentas:**')) {
      return `🛠️ ${linha.replace('**Ferramentas:**', 'Ferramentas:')}`;
    }
    return linha;
  };

  const linhas = texto.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {formatarLinha(line)}
      <br />
    </React.Fragment>
  ));

  return (
    <p className="text-gray-700 text-sm leading-relaxed">
      {linhas}
    </p>
  );
};

export default DescricaoFormatada;