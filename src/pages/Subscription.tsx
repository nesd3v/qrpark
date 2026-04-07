import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscriptionDetails from "@/components/SubscriptionDetails";
import PaymentHistory from "@/components/PaymentHistory";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

const Subscription = () => {
  const { user, loading: authLoading } = useAuth();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/subscription");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-6">
          <motion.div
            className="max-w-2xl mx-auto space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                Abonelik <span className="text-primary">Yönetimi</span>
              </h1>
              <p className="text-muted-foreground text-sm">
                Abonelik detaylarınızı görüntüleyin ve yönetin
              </p>
            </div>

            <SubscriptionDetails />

            {isPremium && <PaymentHistory />}
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Subscription;
