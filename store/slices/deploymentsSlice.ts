import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Deployment, Position } from '../../types';
import { mockDeployments, mockPositions } from '../../mock/mockData';

interface DeploymentsState {
  list: Deployment[];
  positions: Position[];
  selectedId: string | null;
}

const initialState: DeploymentsState = {
  list: mockDeployments,
  positions: mockPositions,
  selectedId: null,
};

const deploymentsSlice = createSlice({
  name: 'deployments',
  initialState,
  reducers: {
    setDeployments: (state, action: PayloadAction<Deployment[]>) => { state.list = action.payload; },
    setPositions: (state, action: PayloadAction<Position[]>) => { state.positions = action.payload; },
    selectDeployment: (state, action: PayloadAction<string | null>) => { state.selectedId = action.payload; },
    pauseDeployment: (state, action: PayloadAction<string>) => {
      const d = state.list.find((x) => x.id === action.payload);
      if (d) d.status = 'paused';
    },
    resumeDeployment: (state, action: PayloadAction<string>) => {
      const d = state.list.find((x) => x.id === action.payload);
      if (d) d.status = 'active';
    },
    stopDeployment: (state, action: PayloadAction<string>) => {
      const d = state.list.find((x) => x.id === action.payload);
      if (d) d.status = 'stopped';
    },
  },
});

export const { setDeployments, setPositions, selectDeployment, pauseDeployment, resumeDeployment, stopDeployment } = deploymentsSlice.actions;
export default deploymentsSlice.reducer;
