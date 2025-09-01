import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  username: null,
  acceptedPrivacyPolicy: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login(state, action) {
      state.isAuthenticated = true;
      state.username = action.payload.username;
      state.acceptedPrivacyPolicy = action.payload.acceptedPrivacyPolicy;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.username = null;
      state.acceptedPrivacyPolicy = false;
    },
    acceptPolicy(state) {
      state.acceptedPrivacyPolicy = true;
    },
  },
});

export const { login, logout, acceptPolicy } = userSlice.actions;
export default userSlice.reducer;
