import { usePlatform } from "@/hooks/usePlatform";
import Dashboard from "./Dashboard";
import MobileDashboard from "./mobile/MobileDashboard";

const DashboardRouter = () => {
  const { isNative } = usePlatform();
  return isNative ? <MobileDashboard /> : <Dashboard />;
};

export default DashboardRouter;
