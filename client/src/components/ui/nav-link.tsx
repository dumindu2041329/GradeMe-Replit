import { useCallback } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useRouteTransition } from "@/hooks/use-route-transition";

interface NavLinkProps {
  href: string;
  className?: string;
  activeClassName?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

export function NavLink({
  href,
  className,
  activeClassName,
  onClick,
  children,
  ...props
}: NavLinkProps & React.HTMLAttributes<HTMLAnchorElement>) {
  const [location] = useLocation();
  const { navigateWithTransition } = useRouteTransition();
  const isActive = location === href;
  
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      
      // Call any onClick handlers passed to the component
      if (onClick) onClick();
      
      // Navigate to the new location with transition effect
      if (location !== href) {
        navigateWithTransition(href);
      }
    },
    [href, location, navigateWithTransition, onClick]
  );

  return (
    <a
      href={href}
      className={cn(
        className, 
        isActive && activeClassName,
        'transition-colors duration-200'
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </a>
  );
}