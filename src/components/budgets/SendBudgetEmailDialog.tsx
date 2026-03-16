import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Mail, Loader2, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SendBudgetEmailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientEmail: string;
    clientName: string;
    budgetCode: string;
    totalFormatted: string;
    modelName: string;
    engineName: string;
    packName: string;
    /** Function that generates the PDF and returns its base64 content */
    generatePdf: () => Promise<string | null>;
}

const SendBudgetEmailDialog = ({
    open,
    onOpenChange,
    clientEmail,
    clientName,
    budgetCode,
    totalFormatted,
    modelName,
    engineName,
    packName,
    generatePdf,
}: SendBudgetEmailDialogProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [recipientEmail, setRecipientEmail] = useState(clientEmail);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<'idle' | 'generating' | 'sending' | 'success' | 'error'>('idle');

    // Reset state when dialog opens
    React.useEffect(() => {
        if (open) {
            setRecipientEmail(clientEmail);
            setStatus('idle');
            setSending(false);
        }
    }, [open, clientEmail]);

    const handleSend = async () => {
        if (!recipientEmail || !recipientEmail.includes('@')) {
            toast({
                title: 'Email inválido',
                description: 'Por favor, introduce un email válido.',
                variant: 'destructive',
            });
            return;
        }

        setSending(true);
        setStatus('generating');

        try {
            // 1. Generate PDF
            const pdfBase64 = await generatePdf();
            if (!pdfBase64) {
                throw new Error('No se pudo generar el PDF');
            }

            // eslint-disable-next-line no-console
            console.log('PDF generated, base64 length:', pdfBase64.length, 'approx KB:', Math.round(pdfBase64.length / 1024));

            setStatus('sending');

            // 2. Send via Edge Function
            const { data, error } = await supabase.functions.invoke('send-budget-email', {
                body: {
                    clientEmail: recipientEmail,
                    clientName,
                    budgetCode,
                    senderName: user?.name || 'Equipo Nomade',
                    senderEmail: user?.email || 'info@nomade-nation.com',
                    pdfBase64,
                    totalFormatted,
                    modelName,
                    engineName,
                    packName,
                },
            });

            if (error) {
                // Try to extract the actual error message from the response
                let errorMsg = error.message;
                try {
                    if (error.context && typeof error.context.json === 'function') {
                        const errBody = await error.context.json();
                        errorMsg = errBody?.error || errBody?.message || errorMsg;
                    }
                } catch { /* ignore parse errors */ }
                console.error('Edge Function error details:', errorMsg);
                throw new Error(errorMsg);
            }
            if (!data?.success) throw new Error(data?.error || 'Error desconocido');

            setStatus('success');

            toast({
                title: '✉️ Email enviado',
                description: `Presupuesto ${budgetCode} enviado a ${recipientEmail}`,
            });

            // Close after a brief success animation
            setTimeout(() => {
                onOpenChange(false);
            }, 1500);

        } catch (error: unknown) {
            console.error('Error sending budget email:', error);
            setStatus('error');
            toast({
                title: 'Error al enviar',
                description: (error as Error).message || 'No se pudo enviar el email. Inténtalo de nuevo.',
                variant: 'destructive',
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !sending && onOpenChange(val)}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-primary" />
                        Enviar Presupuesto por Email
                    </DialogTitle>
                    <DialogDescription>
                        Se enviará el presupuesto <strong className="text-foreground">{budgetCode}</strong> como PDF adjunto.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Summary */}
                    <div className="bg-muted/50 rounded-xl p-4 space-y-2 border border-border/50">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Cliente</span>
                            <span className="font-semibold">{clientName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total</span>
                            <span className="font-bold text-primary">{totalFormatted} €</span>
                        </div>
                    </div>

                    {/* Recipient email */}
                    <div className="space-y-2">
                        <Label htmlFor="recipient-email">Email destinatario</Label>
                        <Input
                            id="recipient-email"
                            type="email"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            placeholder="cliente@email.com"
                            disabled={sending}
                        />
                    </div>

                    {/* Sender info */}
                    <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                        <p><strong>De:</strong> {user?.name || 'Equipo Nomade'} via Nomade</p>
                        <p><strong>Responder a:</strong> {user?.email || '—'}</p>
                    </div>

                    {/* Status indicator */}
                    {status === 'generating' && (
                        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generando PDF...
                        </div>
                    )}
                    {status === 'sending' && (
                        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Enviando email...
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                            <CheckCircle2 className="w-4 h-4" />
                            ¡Email enviado correctamente!
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            Error al enviar. Inténtalo de nuevo.
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={sending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={sending || status === 'success'}
                        className="gap-2"
                    >
                        {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        {sending ? 'Enviando...' : 'Enviar Email'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SendBudgetEmailDialog;
