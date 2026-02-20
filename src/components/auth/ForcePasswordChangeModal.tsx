
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';

const ForcePasswordChangeModal = () => {
    const { mustSetPassword, setMustSetPassword, changePassword } = useAuth();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // No mostrar el modal si no es necesario o si estamos en la intro
    const isIntroPage = window.location.pathname.includes('/intro');
    if (!mustSetPassword || isIntroPage) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast({
                title: "Error",
                description: "Las contraseñas no coinciden",
                variant: "destructive",
            });
            return;
        }

        if (formData.password.length < 6) {
            toast({
                title: "Error",
                description: "La contraseña debe tener al menos 6 caracteres",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const success = await changePassword(formData.password);
            if (success) {
                toast({
                    title: "Acceso activado",
                    description: "Tu contraseña ha sido configurada correctamente.",
                });
                setMustSetPassword(false);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo actualizar la contraseña. Reinténtalo.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={mustSetPassword} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl p-8 rounded-3xl animate-in fade-in zoom-in duration-300">
                <div className="flex flex-col items-center text-center space-y-4 mb-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
                        <ShieldCheck className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">
                            CONFIGURAR CONTRASEÑA
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-500 max-w-xs">
                        Para garantizar la seguridad de tu cuenta, por favor establece una contraseña de acceso.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="pass" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">
                            Nueva Contraseña
                        </Label>
                        <div className="relative group">
                            <Input
                                id="pass"
                                type={showPassword ? "text" : "password"}
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="bg-gray-50/50 border-gray-100 rounded-xl px-4 py-6 focus:ring-primary/20 focus:border-primary transition-all pr-12"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPass" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">
                            Confirmar Contraseña
                        </Label>
                        <Input
                            id="confirmPass"
                            type={showPassword ? "text" : "password"}
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="bg-gray-50/50 border-gray-100 rounded-xl px-4 py-6 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-7 font-black rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                <span>ACTIVANDO CUENTA...</span>
                            </div>
                        ) : (
                            "ACTIVAR ACCESO"
                        )}
                    </Button>

                    <div className="text-center pt-2">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                            Acceso a Plataforma Nomade &copy; {new Date().getFullYear()}
                        </p>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ForcePasswordChangeModal;
