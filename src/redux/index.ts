// All redux store will be exported here
import { store } from './store';
import type { RootState, AppDispatch } from './store';

// Export hooks for accessing the store in components
import { useDispatch, useSelector } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T) => useSelector<RootState, T>(selector);

export { store, type RootState, type AppDispatch };