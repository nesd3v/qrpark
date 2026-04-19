import MobileNotifications from "./mobile/MobileNotifications";
import { usePlatform } from "@/hooks/usePlatform";
import { Navigate } from "react-router-dom";

const NotificationsRouter = () => {
  const { isNative } = usePlatform();
  // Web: notifications live in the dashboard
  return isNative ? <MobileNotifications /> : <Navigate to="/dashboard" replace />;
};

export default NotificationsRouter;
