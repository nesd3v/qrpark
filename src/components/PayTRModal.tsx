import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface PayTRModalProps {
  token: string | null;
  onClose: () => void;
}

const PayTRModal = ({ token, onClose }: PayTRModalProps) => {
  if (!token) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card rounded-2xl border border-border w-full max-w-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-foreground font-semibold">Ödeme</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <iframe
            src={`https://www.paytr.com/odeme/guvenli/${token}`}
            className="w-full h-[500px] border-0"
            title="PayTR Ödeme"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PayTRModal;
