import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Loader2, Database, Table as TableIcon, Shield, ListOrdered, RefreshCw, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../integrations/supabase/client';

interface TableInfo {
  name: string;
  row_count: number;
  size_bytes: number;
  columns: { column_name: string; data_type: string; is_nullable: string; column_default: string | null }[];
}

interface PolicyInfo {
  name: string;
  table: string;
  command: string;
  definition: string;
  permissive: boolean;
}

interface FunctionInfo {
  name: string;
  language: string;
  arguments: string;
  return_type: string;
  source_code: string;
}

const DatabaseInfoTab: React.FC = () => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [policies, setPolicies] = useState<PolicyInfo[]>([]);
  const [functions, setFunctions] = useState<FunctionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);
  const [expandedFunction, setExpandedFunction] = useState<string | null>(null);

  const fetchDatabaseInfo = async () => {
    setLoading(true);
    try {
      // Fetch table info
      const { data: tablesData, error: tablesError } = await supabase.rpc('get_table_info');
      if (tablesError) throw tablesError;

      // Fetch RLS policies
      const { data: policiesData, error: policiesError } = await supabase.rpc('get_policy_info');
      if (policiesError) throw policiesError;

      // Fetch functions
      const { data: functionsData, error: functionsError } = await supabase.rpc('get_function_info');
      if (functionsError) throw functionsError;

      setTables(tablesData || []);
      setPolicies(policiesData || []);
      setFunctions(functionsData || []);
      toast.success('Informações do banco de dados atualizadas!');
    } catch (error: any) {
      console.error('Error fetching database info:', error.message);
      toast.error('Erro ao carregar informações do banco de dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-lg text-gray-600">Carregando informações do banco de dados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-700 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Informações do Banco de Dados 🗄️</h1>
        <p className="opacity-90 mt-1">Visão detalhada das tabelas, políticas de RLS e funções.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-purple-500" />
            Tabelas ({tables.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchDatabaseInfo}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Linhas</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table) => (
                  <React.Fragment key={table.name}>
                    <TableRow>
                      <TableCell className="font-medium">{table.name}</TableCell>
                      <TableCell>{table.row_count}</TableCell>
                      <TableCell>{formatBytes(table.size_bytes)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setExpandedTable(expandedTable === table.name ? null : table.name)}
                        >
                          <Info className="w-4 h-4 mr-2" />
                          {expandedTable === table.name ? 'Ocultar Colunas' : 'Ver Colunas'}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedTable === table.name && (
                      <TableRow>
                        <TableCell colSpan={4} className="p-0">
                          <div className="bg-gray-50 p-4 border-t">
                            <h4 className="font-semibold text-gray-800 mb-2">Colunas de "{table.name}":</h4>
                            <Table className="w-full text-sm">
                              <TableHeader>
                                <TableRow className="bg-gray-100">
                                  <TableHead>Nome</TableHead>
                                  <TableHead>Tipo</TableHead>
                                  <TableHead>Nulo?</TableHead>
                                  <TableHead>Padrão</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {table.columns.map((col, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="font-medium">{col.column_name}</TableCell>
                                    <TableCell>{col.data_type}</TableCell>
                                    <TableCell>{col.is_nullable === 'YES' ? 'Sim' : 'Não'}</TableCell>
                                    <TableCell className="font-mono text-xs">{col.column_default || 'NULL'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Políticas de RLS ({policies.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchDatabaseInfo}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tabela</TableHead>
                  <TableHead>Comando</TableHead>
                  <TableHead>Permissiva</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <React.Fragment key={policy.name}>
                    <TableRow>
                      <TableCell className="font-medium">{policy.name}</TableCell>
                      <TableCell>{policy.table}</TableCell>
                      <TableCell>{policy.command}</TableCell>
                      <TableCell>{policy.permissive ? 'Sim' : 'Não'}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setExpandedPolicy(expandedPolicy === policy.name ? null : policy.name)}
                        >
                          <Info className="w-4 h-4 mr-2" />
                          {expandedPolicy === policy.name ? 'Ocultar Definição' : 'Ver Definição'}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedPolicy === policy.name && (
                      <TableRow>
                        <TableCell colSpan={5} className="p-0">
                          <div className="bg-gray-50 p-4 border-t">
                            <h4 className="font-semibold text-gray-800 mb-2">Definição de "{policy.name}":</h4>
                            <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
                              {policy.definition}
                            </pre>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-orange-500" />
            Funções ({functions.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchDatabaseInfo}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Linguagem</TableHead>
                  <TableHead>Retorno</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {functions.map((func) => (
                  <React.Fragment key={func.name}>
                    <TableRow>
                      <TableCell className="font-medium">{func.name}</TableCell>
                      <TableCell>{func.language}</TableCell>
                      <TableCell>{func.return_type}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setExpandedFunction(expandedFunction === func.name ? null : func.name)}
                        >
                          <Info className="w-4 h-4 mr-2" />
                          {expandedFunction === func.name ? 'Ocultar Código' : 'Ver Código'}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedFunction === func.name && (
                      <TableRow>
                        <TableCell colSpan={4} className="p-0">
                          <div className="bg-gray-50 p-4 border-t">
                            <h4 className="font-semibold text-gray-800 mb-2">Código de "{func.name}":</h4>
                            <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
                              {func.source_code}
                            </pre>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseInfoTab;