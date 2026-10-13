import { Button } from "@mudahin/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@mudahin/ui/components/dropdown-menu";
import { Skeleton } from "@mudahin/ui/components/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, User, UserRound } from "lucide-react";
import { useCallback } from "react";

import { authClient } from "@/lib/auth-client";

/** Menu akun pengguna di header. Bagian dari shell aplikasi. */
export function UserMenu() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = useCallback(() => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate({ to: "/" });
        },
      },
    });
  }, [navigate]);

  if (isPending) {
    return <Skeleton className="size-9 rounded-md" />;
  }

  if (!session) {
    return (
      <Link to="/login">
        <Button aria-label="Masuk" variant="outline">
          <User aria-hidden="true" className="md:hidden" />
          <span className="hidden md:inline">Masuk</span>
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button aria-label="Menu akun" size="icon" variant="outline" />}
      >
        <UserRound aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{session.user.name}</DropdownMenuLabel>
          <DropdownMenuItem>
            <User aria-hidden="true" /> {session.user.email}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} variant="destructive">
            <LogOut aria-hidden="true" /> Keluar
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
