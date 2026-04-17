import { usePlatform } from "@/hooks/usePlatform";
import Profile from "./Profile";
import MobileProfile from "./mobile/MobileProfile";

const ProfileRouter = () => {
  const { isNative } = usePlatform();
  return isNative ? <MobileProfile /> : <Profile />;
};

export default ProfileRouter;
