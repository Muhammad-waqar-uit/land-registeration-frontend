// Utility to update Redux state when tokens are refreshed
// This is called from the axios interceptor to keep Redux in sync

let store: any = null;
let setTokensAction: any = null;

export const setStore = (reduxStore: any) => {
  store = reduxStore;
};

export const setSetTokensAction = (action: any) => {
  setTokensAction = action;
};

export const updateTokensInStore = (accessToken: string, refreshToken?: string) => {
  if (store && setTokensAction) {
    store.dispatch(setTokensAction({ accessToken, refreshToken }));
  }
};
