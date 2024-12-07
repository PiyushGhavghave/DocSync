import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    user : null,
    isLoading :true,
}

const authslice = createSlice({
    name : 'auth',
    initialState,
    reducers : {
        loginUser : (state, action) => {
            state.user = action.payload
        },
        logoutUser : (state, action) => {
            state.user = null
        },
        setLoading : (state, action) => {
            state.isLoading = action.payload;
        }
    }

})

export const {loginUser, logoutUser, setLoading} = authslice.actions

export default authslice.reducer