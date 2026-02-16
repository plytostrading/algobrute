import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import portfolioReducer from './slices/portfolioSlice';
import deploymentsReducer from './slices/deploymentsSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      ui: uiReducer,
      portfolio: portfolioReducer,
      deployments: deploymentsReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
