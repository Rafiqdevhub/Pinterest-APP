import { create } from "zustand";

const userEditorStore = create((set) => ({
  editor: null,
  setEditor: (editor) => set({ editor }),
}));

export default userEditorStore;
