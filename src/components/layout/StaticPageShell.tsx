import MobileLayout from "@/components/layout/MobileLayout";
import { usePlatform } from "@/hooks/usePlatform";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ReactNode } from "react";

type Props = { title: string; children: ReactNode };

const StaticPageShell = ({ title, children }: Props) => {
  const { isNative } = usePlatform();

  if (isNative) {
    return (
      <MobileLayout title={title} showBack hideBottomNav>
        <article className="prose prose-invert prose-sm max-w-none [&_h2]:text-base [&_h2]:font-display [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_ul]:text-sm [&_ul]:text-muted-foreground [&_li]:my-1">
          {children}
        </article>
      </MobileLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-8">{title}</h1>
          <article className="prose prose-invert max-w-none [&_h2]:text-xl [&_h2]:font-display [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_ul]:text-muted-foreground">
            {children}
          </article>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StaticPageShell;
