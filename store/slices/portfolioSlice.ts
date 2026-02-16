import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PortfolioSnapshot, ActionCue } from '../../types';
import { mockPortfolio, mockActionCues } from '../../mock/mockData';

interface PortfolioState {
  snapshot: PortfolioSnapshot;
  actionCues: ActionCue[];
}

const initialState: PortfolioState = {
  snapshot: mockPortfolio,
  actionCues: mockActionCues,
};

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    setSnapshot: (state, action: PayloadAction<PortfolioSnapshot>) => {
      state.snapshot = action.payload;
    },
    setActionCues: (state, action: PayloadAction<ActionCue[]>) => {
      state.actionCues = action.payload;
    },
    dismissCue: (state, action: PayloadAction<string>) => {
      state.actionCues = state.actionCues.filter((cue) => cue.id !== action.payload);
    },
  },
});

export const { setSnapshot, setActionCues, dismissCue } = portfolioSlice.actions;
export default portfolioSlice.reducer;
