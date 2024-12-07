import { configureStore } from "@reduxjs/toolkit"
import authReducer from '../features/authslice/authslice'
import folderReducer from '../features/folderSlice/folderslice'

export const store = configureStore({
    reducer : {
        auth : authReducer,
        folder : folderReducer
    }
})