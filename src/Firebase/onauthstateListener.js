import { loginUser, logoutUser, setLoading } from "../features/authslice/authslice";
import { onAuthStateChanged } from "firebase/auth";
import { useDispatch } from "react-redux";
import { auth } from "./firebase-config";
import { useEffect } from "react";
import { fetchFolders } from "@/features/folderSlice/folderslice";


export default function useOnauthstateListener(){
    const dispatch = useDispatch();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth,async (user) => {
            if(user){
                const userData = {
                    uid : user.uid,
                    name : user.displayName,
                    email : user.email,
                    photoURL : user.photoURL,
                }
                dispatch(loginUser(userData))
                await dispatch(fetchFolders(user.uid))
            }
            else{
                dispatch(logoutUser())
            }
            //remove loading state
            dispatch(setLoading(false))
        })

        return () => unsubscribe();
    },[dispatch])
}

