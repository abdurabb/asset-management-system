// providers/ReduxProvider.tsx

"use client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/redux/store";

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
            <p className="text-sm font-semibold text-slate-300">
              Loading app...
            </p>
          </main>
        }
        persistor={persistor}
      >
        {children}
      </PersistGate>
    </Provider>
  );
}