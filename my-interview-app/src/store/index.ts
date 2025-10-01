// import { configureStore } from '@reduxjs/toolkit';
// import storage from 'redux-persist/lib/storage';
// import { persistReducer, persistStore } from 'redux-persist';
// import candidatesReducer from './candidatesSlice';

// const persistConfig = {
//   key: 'root', // The key for the persisted state in storage
//   storage,      // The storage engine to use (localStorage by default)
// };

// // Create a persisted reducer by wrapping the candidatesReducer
// const persistedReducer = persistReducer(persistConfig, candidatesReducer);

// export const store = configureStore({
//   reducer: {
//     // Use the persisted reducer for the 'candidates' state
//     candidates: persistedReducer,
//   },
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: {
//         // These actions from redux-persist are not serializable, so they should be ignored
//         ignoredActions: ['persist/PERSIST'],
//       },
//     }),
// });

// // Create a persistor object for the PersistGate component
// export const persistor = persistStore(store);

// // Export types for use throughout the application
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

import { configureStore } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';
import candidatesReducer from './candidatesSlice';

const persistConfig = {
  key: 'root',
  storage,
};

const persistedReducer = persistReducer(persistConfig, candidatesReducer);

export const store = configureStore({
  reducer: {
    candidates: persistedReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // It's common to disable this check with redux-persist
      serializableCheck: false,
    }),
  // FIX: This line explicitly enables the Redux DevTools extension
  // It ensures the DevTools are only active in development, not in production.
  devTools: import.meta.env.MODE !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

