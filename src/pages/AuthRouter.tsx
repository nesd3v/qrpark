import Auth from "./Auth";
import MobileAuth from "./mobile/MobileAuth";
import { usePlatform } from "@/hooks/usePlatform";

const AuthRouter = () => {
  const { isNative } = usePlatform();
  return isNative ? <MobileAuth /> : <Auth />;
};

export default AuthRouter;
