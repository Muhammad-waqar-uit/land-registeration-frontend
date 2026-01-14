// Utility to update Redux state when tokens are refreshed
// This is called from the axios interceptor to keep Redux in sync
import type { Store, AnyAction } from '@reduxjs/toolkit';

let store: Store | null = null;
let setTokensAction: ((payload: { accessToken: string; refreshToken?: string }) => AnyAction) | null = null;

export const setStore = (reduxStore: Store) => {
  store = reduxStore;
};

export const setSetTokensAction = (action: (payload: { accessToken: string; refreshToken?: string }) => AnyAction) => {
  setTokensAction = action;
};

export const updateTokensInStore = (accessToken: string, refreshToken?: string) => {
  if (store && setTokensAction) {
    store.dispatch(setTokensAction({ accessToken, refreshToken }));
  }
};
