import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { forget, identify } from "./analytics";
import { flushOutbox, startOutbox } from "./offline/outbox";
import { forgetCachedHistory } from "./progress/storage";

type AuthState = {
  user: User | null;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setInitialized: (v: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  setUser: (user) => set({ user }),
  setInitialized: (v) => set({ initialized: v }),
}));

let listenerStarted = false;

export function startAuthListener() {
  if (listenerStarted) return;
  listenerStarted = true;
  startOutbox();

  supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) identify(data.session.user.id);
    useAuthStore.getState().setUser(data.session?.user ?? null);
    useAuthStore.getState().setInitialized(true);
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) identify(session.user.id);
    if (event === "SIGNED_IN") void flushOutbox();
    if (event === "SIGNED_OUT") {
      forget();
      forgetCachedHistory();
    }
    useAuthStore.getState().setUser(session?.user ?? null);
    useAuthStore.getState().setInitialized(true);
  });
}
