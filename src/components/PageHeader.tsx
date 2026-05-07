import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, backTo, actions }: PageHeaderProps) {
  const navigate = useNavigate();
  const onBack = () => {
    if (backTo) navigate(backTo);
    else if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex items-start gap-3 min-w-0 flex-1 sm:items-center">
        <Button
          variant="secondary"
          size="icon"
          onClick={onBack}
          aria-label="Kembali"
          className="shrink-0 mt-0.5 sm:mt-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground text-xs sm:text-sm truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">{actions}</div>}
    </div>
  );
}
