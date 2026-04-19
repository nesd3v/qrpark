import GenerateQR from "./GenerateQR";
import MobileGenerateQR from "./mobile/MobileGenerateQR";
import { usePlatform } from "@/hooks/usePlatform";

const GenerateQRRouter = () => {
  const { isNative } = usePlatform();
  return isNative ? <MobileGenerateQR /> : <GenerateQR />;
};

export default GenerateQRRouter;
