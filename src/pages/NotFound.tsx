import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: route inexistante :", location.pathname);
  }, [location.pathname]);

  return (
    <div className="container flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center py-20 text-center">
      <div className="text-gradient-primary text-7xl font-bold md:text-9xl">404</div>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
        Page introuvable
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        La page <span className="font-mono text-sm">{location.pathname}</span> n'existe pas
        ou a été déplacée.
      </p>
      <Button asChild className="mt-8">
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'accueil
        </Link>
      </Button>
    </div>
  );
};

export default NotFound;
