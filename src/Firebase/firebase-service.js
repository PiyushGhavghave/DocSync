import {doc, collection, getDocs, addDoc,updateDoc, deleteDoc, query, where, setDoc} from 'firebase/firestore'
import { db } from './firebase-config';


export const  FirebaseService = {
    //CRUD for folders
    async addFolder(userUID){
        try{
            const folder = {
                name : 'New Folder',
                type : 'folder'
            }
            const folderRef = collection(db,"users",userUID,"folders")
            const docref = await addDoc(folderRef, folder)
            return docref.id;
        }
        catch(err){
            console.error("Error Adding folder:" ,err)
        }
    },
    
    async getFolders(userUID) {
        try{
            const folderRef = collection(db,"users",userUID,"folders")
            const snapshot = await getDocs(folderRef)
            const folders = snapshot.docs.map((doc) => (
                {...doc.data(), id: doc.id}
            ))

            //fetch files for each folder
            const updatedFolders = await Promise.all(
                folders.map(async (folder) => {
                    const fileRef = collection(db, "users",userUID,"folders",folder.id, "documents")
                    const newSnapshot = await getDocs(fileRef)
                    const files = newSnapshot.docs.map((file) => (
                        {...file.data(), id : file.id}
                    ))

                    return {
                        ...folder,
                        children : files,
                    }
                })
            )
            return updatedFolders;
        }
        catch(err){
            console.error("Error getting folders", err)
        }
    },

    async updateFolder(userUID, folderID, newText){     
        try {
            const folderRef = doc(db, "users", userUID,"folders", folderID)
            await updateDoc(folderRef, {name: newText})
        } catch (err) {
            console.error("Error updating folder:", err);
        }
    },

    async deleteFolder(userUID,folderID) {
        try{
            const folderRef =  doc(db, "users", userUID,"folders", folderID)
            await deleteDoc(folderRef)
        }
        catch(err) {
            console.error("error deleteing the folder",err)
        }
    },

    // CRUD for Files
    async addFile(userUID, parentID) {
        try{
            const newfile = {
                name : 'New Document',
                type : 'file'
            }
            const fileRef = collection(db,"users", userUID,"folders",parentID,"documents")
            const docref = await addDoc(fileRef,newfile)

            //Also create file in "document" collection
            await setDoc(doc(db, "documents", docref.id),{
                name: 'New Document',
                content : '',
            })

            return docref.id;
        }
        catch(err){
            console.error("Error adding file" , err)
        }
    },

    async updateFile(userUID,childID, newText){
        try{
            const fileRef = collection(db, "users",userUID, "folders")
            const snapshot = await getDocs(fileRef)

            for(const folder of snapshot.docs){
                const newfileRef = collection(folder.ref, "documents")
                
                const q = query(newfileRef,where("__name__","==",childID))
                const newSnapshot = await getDocs(q)

                if(!newSnapshot.empty){
                    const filedoc = newSnapshot.docs[0]
                    await updateDoc(filedoc.ref, {name : newText})

                    //Also update name in "document" collection
                    await updateDoc(doc(db,"documents",filedoc.id), {name : newText})
                    break;
                }
            }
        }
        catch(err){
            console.error("Error updating file" , err)
        }
    },

    async deleteFile(userUID,childID) {
        try{
            const fileRef = collection(db, "users", userUID, "folders")
            const snapshot = await getDocs(fileRef)

            for(const folder of snapshot.docs){
                const newfileRef = collection(folder.ref,"documents")

                const q = query(newfileRef, where("__name__", "==", childID))
                const newSnapshot = await getDocs(q)

                if(!newSnapshot.empty ){
                    const filedoc = newSnapshot.docs[0]
                    await deleteDoc(filedoc.ref)
                    
                    //Also delete file from "document" collection
                    await deleteDoc(doc(db,"documents",filedoc.id))
                    break;
                }
            }
        }
        catch(err){
            console.error("Error deleting file" , err);
        }
    }

    
}