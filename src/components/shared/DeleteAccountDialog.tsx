import { useState } from "react";
import { AlertTriangle, Crown, Trash2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { translateError } from "@/lib/translateError";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface DeleteAccountDialogProps {
  isPremium: boolean;
  userEmail: string;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

const DeleteAccountDialog = ({ isPremium, userEmail, externalOpen, onExternalOpenChange }: DeleteAccountDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = onExternalOpenChange ?? setInternalOpen;
  const [step, setStep] = useState<"confirm" | "password">("confirm");
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();

  const resetState = () => {
    setStep("confirm");
    setPassword("");
    setConfirmText("");
    setDeleting(false);
    setVerifying(false);
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) resetState();
  };

  const handleVerifyPassword = async () => {
    if (!password.trim()) return;
    setVerifying(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password,
      });
      if (error) {
        toast.error("Şifre yanlış. Lütfen tekrar deneyin.");
        return;
      }
      setStep("password");
    } catch {
      toast.error("Doğrulama sırasında bir hata oluştu");
    } finally {
      setVerifying(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== "SİL") return;
    setDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Oturum bulunamadı");

      const res = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw res.error;

      await supabase.auth.signOut();
      toast.success("Hesabınız başarıyla silindi");
      navigate("/");
    } catch (err: any) {
      toast.errortranslateError(err, "Hesap silinemedi");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {onExternalOpenChange == null && (
        <AlertDialogTrigger asChild>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors mt-2">
            <Trash2 className="w-4 h-4" />
            Hesabımı Sil
          </button>
        </AlertDialogTrigger>
      )}
      <AlertDialogContent className="max-w-md">
        {step === "confirm" ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <Lock className="w-5 h-5" />
                Kimlik Doğrulama
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 text-left">
                <p>
                  Hesabınızı silmeden önce kimliğinizi doğrulamamız gerekiyor. Lütfen mevcut şifrenizi girin.
                </p>

                {isPremium && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <Crown className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Premium aboneliğiniz iptal edilecek</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Aktif Premium üyeliğiniz derhal sonlandırılacak ve iade yapılmayacaktır.
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-2 space-y-2">
                  <Label className="text-sm text-foreground font-medium flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Mevcut Şifreniz
                  </Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="border-destructive/30 focus:border-destructive"
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={verifying}>Vazgeç</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleVerifyPassword}
                disabled={!password.trim() || verifying}
              >
                {verifying ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
                    Doğrulanıyor...
                  </span>
                ) : (
                  "Devam Et"
                )}
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Hesabı Kalıcı Olarak Sil
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 text-left">
                <p>
                  Bu işlem geri alınamaz. Hesabınız, araçlarınız, bildirim geçmişiniz ve tüm verileriniz kalıcı olarak silinecektir.
                </p>

                <div className="pt-2">
                  <p className="text-sm text-foreground mb-2">
                    Onaylamak için <span className="font-bold text-destructive">SİL</span> yazın:
                  </p>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="SİL"
                    className="border-destructive/30 focus:border-destructive"
                    onKeyDown={(e) => e.key === "Enter" && confirmText === "SİL" && handleDelete()}
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting} onClick={() => setStep("confirm")}>Geri</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={confirmText !== "SİL" || deleting}
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
                    Siliniyor...
                  </span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Hesabı Sil
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
