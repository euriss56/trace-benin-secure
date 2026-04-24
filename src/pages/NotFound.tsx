import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Trans, useTranslation } from "react-i18next";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404: route inexistante :", location.pathname);
  }, [location.pathname]);

  return (
    <div className="container flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center py-20 text-center">
      <div className="text-gradient-primary text-7xl font-bold md:text-9xl">404</div>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
        {t('notFound.title')}
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        <Trans
          i18nKey="notFound.description"
          values={{ path: location.pathname }}
          components={{ code: <span className="font-mono text-sm" /> }}
        />
      </p>
      <Button asChild className="mt-8">
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('notFound.back')}
        </Link>
      </Button>
    </div>
  );
};

export default NotFound;
