import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/context/AppContext";
import { useLocation } from "wouter";
import { 
  ShieldCheck, 
  Upload, 
  FileCheck, 
  Clock, 
  XCircle, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VerificationStatus {
  status: "pending" | "approved" | "rejected" | null;
  documentType?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export default function Verification() {
  const { user } = useAppContext();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  
  const [documentType, setDocumentType] = useState("CPF");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const loadVerification = async () => {
      try {
        const res = await fetch(`/api/sellers/${user.id}/verification`, {
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          setVerification(data);
        } else {
          setVerification(null);
        }
      } catch (error) {
        console.error("Failed to load verification status");
      } finally {
        setLoading(false);
      }
    };

    loadVerification();
  }, [user, navigate]);

  const formatCpfCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (documentType === "CPF") {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
    } else {
      return numbers
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanNumber = cpfCnpj.replace(/\D/g, "");
    if (documentType === "CPF" && cleanNumber.length !== 11) {
      toast.error("CPF deve ter 11 dígitos");
      return;
    }
    if (documentType === "CNPJ" && cleanNumber.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos");
      return;
    }

    setSubmitting(true);
    try {
      let documentUrl = null;
      if (documentFile) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(documentFile);
        });
        documentUrl = base64;
      }

      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          cpfCnpj: cleanNumber,
          documentType,
          documentUrl,
        }),
      });

      if (res.ok) {
        toast.success("Solicitação de verificação enviada com sucesso!");
        setVerification({ status: "pending", documentType });
      } else {
        const data = await res.json();
        toast.error(data.message || "Erro ao enviar verificação");
      }
    } catch (error) {
      toast.error("Erro ao enviar verificação");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadge = () => {
    if (!verification) return null;
    
    switch (verification.status) {
      case "approved":
        return (
          <Badge className="bg-green-500 text-white gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Verificado
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Em análise
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejeitado
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold font-serif mb-2">Verificação de Vendedor</h1>
          <p className="text-muted-foreground">
            Vendedores verificados transmitem mais confiança e têm maior destaque na plataforma.
          </p>
        </div>

        {verification?.status === "approved" ? (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <CardTitle className="text-green-700 dark:text-green-400">
                    Conta Verificada!
                  </CardTitle>
                  <CardDescription>
                    Verificado em {new Date(verification.approvedAt!).toLocaleDateString("pt-BR")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-green-700 dark:text-green-400">
                  Sua conta está verificada e você possui o selo de vendedor confiável.
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Seus anúncios aparecem com destaque</li>
                  <li>Compradores veem o selo de verificação</li>
                  <li>Mais credibilidade nas negociações</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : verification?.status === "pending" ? (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <CardTitle className="text-yellow-700 dark:text-yellow-400">
                    Verificação em Análise
                  </CardTitle>
                  <CardDescription>
                    Tipo de documento: {verification.documentType}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-yellow-700 dark:text-yellow-400">
                <p>
                  Sua solicitação está sendo analisada pela nossa equipe.
                  O processo geralmente leva até 48 horas úteis.
                </p>
                <p className="text-muted-foreground">
                  Você receberá um email quando sua verificação for concluída.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : verification?.status === "rejected" ? (
          <>
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 mb-6">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <CardTitle className="text-red-700 dark:text-red-400">
                      Verificação Rejeitada
                    </CardTitle>
                    <CardDescription className="text-red-600">
                      {verification.rejectionReason || "Documentação inválida ou ilegível."}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Você pode enviar uma nova solicitação com os documentos corretos.
                </p>
              </CardContent>
            </Card>
            <VerificationForm
              documentType={documentType}
              setDocumentType={setDocumentType}
              cpfCnpj={cpfCnpj}
              setCpfCnpj={setCpfCnpj}
              formatCpfCnpj={formatCpfCnpj}
              documentFile={documentFile}
              setDocumentFile={setDocumentFile}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </>
        ) : (
          <VerificationForm
            documentType={documentType}
            setDocumentType={setDocumentType}
            cpfCnpj={cpfCnpj}
            setCpfCnpj={setCpfCnpj}
            formatCpfCnpj={formatCpfCnpj}
            documentFile={documentFile}
            setDocumentFile={setDocumentFile}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}

        <Card className="mt-6 border-blue-100 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">
                  Por que ser verificado?
                </p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Maior visibilidade nos resultados de busca</li>
                  <li>• Selo de confiança visível em todos os seus anúncios</li>
                  <li>• Aumento de até 40% nas visualizações</li>
                  <li>• Compradores preferem negociar com vendedores verificados</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function VerificationForm({
  documentType,
  setDocumentType,
  cpfCnpj,
  setCpfCnpj,
  formatCpfCnpj,
  documentFile,
  setDocumentFile,
  onSubmit,
  submitting,
}: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          Solicitar Verificação
        </CardTitle>
        <CardDescription>
          Envie seus documentos para análise. Suas informações são protegidas e usadas apenas para verificação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Tipo de Documento</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger data-testid="select-document-type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CPF">CPF (Pessoa Física)</SelectItem>
                <SelectItem value="CNPJ">CNPJ (Pessoa Jurídica)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf-cnpj">
              {documentType === "CPF" ? "CPF" : "CNPJ"}
            </Label>
            <Input
              id="cpf-cnpj"
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
              placeholder={documentType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
              maxLength={documentType === "CPF" ? 14 : 18}
              data-testid="input-cpf-cnpj"
            />
          </div>

          <div className="space-y-2">
            <Label>Documento com Foto (opcional)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                className="hidden"
                id="document-upload"
              />
              <label htmlFor="document-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                {documentFile ? (
                  <p className="text-sm text-primary font-medium">{documentFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Clique para enviar ou arraste o arquivo
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      RG, CNH ou Contrato Social (PDF ou imagem até 5MB)
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || !cpfCnpj}
            data-testid="button-submit-verification"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Solicitar Verificação
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
