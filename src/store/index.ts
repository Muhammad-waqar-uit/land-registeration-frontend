import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setTokens } from './slices/authSlice';
import { setStore, setSetTokensAction } from '../utils/tokenRefresh';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// Make store and actions available for token refresh utility
setStore(store);
setSetTokensAction(setTokens);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

