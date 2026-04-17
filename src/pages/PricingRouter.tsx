import { usePlatform } from "@/hooks/usePlatform";
import Pricing from "./Pricing";
import MobilePricing from "./mobile/MobilePricing";

const PricingRouter = () => {
  const { isNative } = usePlatform();
  return isNative ? <MobilePricing /> : <Pricing />;
};

export default PricingRouter;
