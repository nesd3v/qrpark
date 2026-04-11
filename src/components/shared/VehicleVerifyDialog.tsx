import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Loader2, MessageSquare, CheckCircle2 } from "lucide-react";

interface VehicleVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  plate: string;
  phone: string;
  onVerified: () => void;
}

const VehicleVerifyDialog = ({ open, onOpenChange, vehicleId, plate, phone, onVerified }: VehicleVerifyDialogProps) => {
  const [step, setStep] = useState<"idle" | "sending" | "input" | "verifying" | "done">("idle");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!open) {
      setStep("idle");
      setCode("");
      setCooldown(0);
    }
  }, [open]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const maskedPhone = phone.replace(/(\+90)(\d{3})(\d{3})(\d{2})(\d{2})/, "$1 $2 *** ** $5");

  const sendOtp = async () => {
    setStep("sending");
    try {
      const { data, error } = await supabase.functions.invoke("phone-otp", {
        body: { action: "send", phone },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setStep("input");
      setCooldown(30);
      toast.success("Doğrulama kodu gönderildi");
    } catch (err: any) {
      toast.error(err.message || "SMS gönderilemedi");
      setStep("idle");
    }
  };

  const verifyOtp = async () => {
    if (code.length !== 6) return;
    setStep("verifying");
    try {
      const { data, error } = await supabase.functions.invoke("phone-otp", {
        body: { action: "verify", phone, code, vehicle_id: vehicleId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.verified) {
        setStep("done");
        toast.success(`${plate} başarıyla doğrulandı!`);
        setTimeout(() => {
          onVerified();
          onOpenChange(false);
        }, 1500);
      }
    } catch (err: any) {
      toast.error(err.message || "Doğrulama başarısız");
      setCode("");
      setStep("input");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Araç Doğrulama
          </DialogTitle>
          <DialogDescription>
            <span className="font-mono font-bold text-foreground">{plate}</span> plakasını doğrulamak için kayıtlı telefona SMS kodu gönderilecek.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {step === "done" ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
              <p className="font-semibold text-foreground">Araç doğrulandı!</p>
            </div>
          ) : step === "input" || step === "verifying" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                <span className="font-medium text-foreground">{maskedPhone}</span> numarasına 6 haneli kod gönderildi.
              </p>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={setCode} disabled={step === "verifying"}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button onClick={verifyOtp} disabled={code.length !== 6 || step === "verifying"} className="w-full gradient-primary text-primary-foreground">
                {step === "verifying" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Doğrula
              </Button>
              <button
                onClick={sendOtp}
                disabled={cooldown > 0}
                className="text-xs text-primary hover:underline disabled:text-muted-foreground disabled:no-underline w-full text-center"
              >
                {cooldown > 0 ? `Tekrar gönder (${cooldown}s)` : "Tekrar gönder"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-secondary rounded-lg p-4 text-sm space-y-1">
                <p><span className="text-muted-foreground">Telefon:</span> <span className="font-medium">{maskedPhone}</span></p>
              </div>
              <Button onClick={sendOtp} disabled={step === "sending"} className="w-full gradient-primary text-primary-foreground gap-2">
                {step === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                SMS Kodu Gönder
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleVerifyDialog;
