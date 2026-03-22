import { Link } from "react-router-dom";
import { Car, QrCode, LogIn, LogOut, Bell, User, Crown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { isPremium } = useSubscription();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
            <Car className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-bold text-foreground">
            QR<span className="text-primary">Park</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/generate">
                <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
                  <QrCode className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">QR Oluştur</span>
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Bell className="w-4 h-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Bildirimler</span>
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="ghost" size="sm" className={isPremium ? "text-yellow-500 hover:text-yellow-400" : "text-muted-foreground hover:text-foreground"}>
                  <Crown className={`w-4 h-4 sm:mr-1.5 ${isPremium ? "fill-yellow-500/20 drop-shadow-[0_0_4px_rgba(234,179,8,0.5)]" : ""}`} />
                  <span className="hidden sm:inline">{isPremium ? "Premium" : "Premium"}</span>
                  {isPremium && (
                    <span className="hidden sm:inline-flex ml-1 text-[9px] font-bold bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded-full leading-none">
                      ✓
                    </span>
                  )}
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <User className="w-4 h-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Hesap</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 cursor-pointer">
                    <LogOut className="w-4 h-4" />
                    Çıkış Yap
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteOpen(true)}
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hesabımı Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Hidden dialog triggered from dropdown */}
              <DeleteAccountDialog
                isPremium={isPremium}
                userEmail={user?.email || ""}
                externalOpen={deleteOpen}
                onExternalOpenChange={setDeleteOpen}
              />
            </>
          ) : (
            <>
              <Link to="/generate">
                <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
                  <QrCode className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">QR Oluştur</span>
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Crown className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">Premium</span>
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <LogIn className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">Giriş</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
