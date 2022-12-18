import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLoading: false,
  error: null,
};

const slice = createSlice({
  name: "product",
  initialState,
  reducers: {},
});

export default slice.reducer;
