import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Database, Download, Loader2, FileText, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TableStats {
  name: string;
  count: number;
}

interface MigrationStats {
  tables: TableStats[];
  totalRecords: number;
}

export default function AdminMigration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch("/api/admin/migration/stats", {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const downloadSQL = async () => {
    setIsExporting(true);
    
    try {
      const response = await fetch("/api/admin/migration/export-sql", {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Export failed");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'supabase_migration.sql';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setExported(true);
      toast({
        title: "Exportado com sucesso!",
        description: "O arquivo SQL foi baixado. Siga as instrucoes abaixo para importar no Supabase."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Nao foi possivel exportar os dados",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/")}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Migracao para Supabase
            </CardTitle>
            <CardDescription>
              Exporte todos os dados do banco atual para importar no Supabase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingStats ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : stats && (
              <>
                <div className="space-y-3">
                  <h3 className="font-semibold">Dados a serem exportados:</h3>
                  <div className="grid gap-2">
                    {stats.tables.map((table) => (
                      <div 
                        key={table.name}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <span className="font-mono text-sm">{table.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {table.count} registros
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="font-semibold">
                      Total: {stats.totalRecords} registros
                    </p>
                  </div>
                </div>

                <Button
                  onClick={downloadSQL}
                  disabled={isExporting}
                  size="lg"
                  className="w-full"
                  data-testid="button-export-sql"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : exported ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {isExporting ? "Exportando..." : exported ? "Baixar Novamente" : "Baixar Arquivo SQL"}
                </Button>

                {exported && (
                  <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <AlertTitle>Como importar no Supabase</AlertTitle>
                    <AlertDescription className="space-y-3 mt-2">
                      <p><strong>Opcao 1 - SQL Editor (Recomendado):</strong></p>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Acesse seu projeto no Supabase</li>
                        <li>Va em <strong>SQL Editor</strong> no menu lateral</li>
                        <li>Clique em <strong>New query</strong></li>
                        <li>Cole o conteudo do arquivo SQL</li>
                        <li>Clique em <strong>Run</strong></li>
                      </ol>
                      
                      <p className="pt-2"><strong>Opcao 2 - Via Terminal (psql):</strong></p>
                      <code className="block p-2 bg-muted rounded text-xs break-all">
                        psql "sua_url_supabase" -f supabase_migration.sql
                      </code>
                      
                      <p className="pt-3 text-sm">
                        <strong>Depois de importar:</strong> Me avise para atualizar a conexao do sistema para usar o Supabase!
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
