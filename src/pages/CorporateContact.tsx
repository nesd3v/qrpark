import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CorporateContactForm from "@/components/CorporateContactForm";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Building2, Shield } from "lucide-react";

const CorporateContact = () => {
  const [searchParams] = useSearchParams();
  const planType = searchParams.get("plan") || "filo";
  const planLabel = planType === "avm" ? "AVM & Otopark" : "Filo Yönetimi";
  const PlanIcon = planType === "avm" ? Shield : Building2;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-6 max-w-lg">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <PlanIcon className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
              {planLabel} <span className="text-primary">Başvurusu</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Formu doldurun, ekibimiz en kısa sürede sizinle iletişime geçsin.
            </p>
          </motion.div>

          <motion.div
            className="glass rounded-2xl p-8 border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CorporateContactForm planType={planType} />
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CorporateContact;
