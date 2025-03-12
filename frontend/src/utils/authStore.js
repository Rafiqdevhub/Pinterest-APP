import { create } from "zustand";

const useAuthStore = create((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  removeCurrentUser: () => set({ currentUser: null }),
}));

export default useAuthStore;
