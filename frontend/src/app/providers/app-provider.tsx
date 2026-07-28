import { type PropsWithChildren } from "react";

import { QueryProvider } from "./query-provider";

export function AppProvider({ children }: PropsWithChildren) {
  return <QueryProvider>{children}</QueryProvider>;
}
