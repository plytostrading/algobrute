import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarCollapsed: boolean;
  colorMode: 'light' | 'dark';
  activeOperationsTab: number;
  activeWorkbenchTab: number;
}

const initialState: UIState = {
  sidebarCollapsed: false,
  colorMode: 'light',
  activeOperationsTab: 0,
  activeWorkbenchTab: 1,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => { state.sidebarCollapsed = !state.sidebarCollapsed; },
    setColorMode: (state, action: PayloadAction<'light' | 'dark'>) => { state.colorMode = action.payload; },
    toggleColorMode: (state) => { state.colorMode = state.colorMode === 'light' ? 'dark' : 'light'; },
    setActiveOperationsTab: (state, action: PayloadAction<number>) => { state.activeOperationsTab = action.payload; },
    setActiveWorkbenchTab: (state, action: PayloadAction<number>) => { state.activeWorkbenchTab = action.payload; },
  },
});

export const { toggleSidebar, setColorMode, toggleColorMode, setActiveOperationsTab, setActiveWorkbenchTab } = uiSlice.actions;
export default uiSlice.reducer;
