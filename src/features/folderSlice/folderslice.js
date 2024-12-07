import { FirebaseService } from "@/Firebase/firebase-service";
import { createAsyncThunk, createSlice, nanoid } from "@reduxjs/toolkit";

const initialState = {
    folders : [],
    expandedFolders : [],
    selectedDocument : null,
    isSidebarOpen : true,

}

//-------------- async thunk for performing the async operation like CRUD... then after completion / rejection (rejectwithvalue) we can 
//-------------- set it in local state using "extrareducers"

//Folders
export const fetchFolders = createAsyncThunk("folders/fetch", async (userUID) => {
    return await FirebaseService.getFolders(userUID)
})
export const createFolder = createAsyncThunk("folders/add",async (userUID) => {
    return await FirebaseService.addFolder(userUID)
})
export const renameFolder = createAsyncThunk("folders/update", async ({userUID, folderID, newText}) => {
    await FirebaseService.updateFolder(userUID,folderID, newText)
    return {folderID , newText}
} )
export const deleteFolder = createAsyncThunk("folders/delete", async ({userUID,folderID}) => {
    await FirebaseService.deleteFolder(userUID,folderID)
    return folderID;
})

// files
export const createFile = createAsyncThunk("files/add", async ({userUID, folderID}) => {
    const fileID = await FirebaseService.addFile(userUID, folderID)
    return {folderID, fileID}
})
export const renameFile = createAsyncThunk("files/update", async ({userUID,fileID, newText}) => {
    await FirebaseService.updateFile(userUID,fileID, newText)
    return {fileID, newText}
})
export const deleteFile = createAsyncThunk("files/delete", async ({userUID, fileID}) => {
    await FirebaseService.deleteFile(userUID,fileID)
    return fileID
})

const folderSlice = createSlice({
    name : 'folders',
    initialState,
    reducers : {
        toggleExpandedFolders : (state, action) => {
            const folderID = action.payload

            if(state.expandedFolders.includes(folderID)){
                state.expandedFolders = state.expandedFolders.filter((id) => id !== folderID)
            }
            else{
                state.expandedFolders.push(folderID)
            }
        },
        toggleSideBar : (state) => {
            state.isSidebarOpen = !state.isSidebarOpen;
        },
        selectDocument : (state, action) => {
            state.selectedDocument = action.payload;
            state.isSidebarOpen = false;
        }
    },

    extraReducers : (builder) => {
        //local change for folders
        builder
        .addCase(fetchFolders.fulfilled, (state, action) => {
            state.folders = action.payload;
        })
        .addCase(createFolder.fulfilled, (state, action) => {
            const folderID = action.payload
            const newFolder = {
                id : folderID,
                name : 'New Folder',
                type : 'folder',
            }
            state.folders.push(newFolder);
            state.expandedFolders.push(newFolder.id)
        })
        .addCase(renameFolder.fulfilled, (state, action) => {
            const {folderID , newText} = action.payload
            
            state.folders = state.folders.map((folder) => (
                folder.id === folderID ? {...folder ,name : newText} : folder
            ))
        })
        .addCase(deleteFolder.fulfilled, (state, action) => {
            const folderID = action.payload
            state.folders = state.folders.filter((folder) => (
                folder.id !== folderID
            ))
            state.expandedFolders = state.expandedFolders.filter((id) => id !== folderID)
        })

        //local changes for files
        .addCase(createFile.fulfilled, (state, action) => {
            const {folderID, fileID} = action.payload;
            const newfile = {
                id : fileID,
                name : 'New Document',
                type : 'file'
            }
            state.folders = state.folders.map((folder) => {
                if(folder.id === folderID){
                    return {
                        ...folder,
                        children : folder.children ? [...folder.children , newfile] : [newfile],
                    }
                }
                return folder;
            })
            state.expandedFolders.push(folderID)
        })
        .addCase(renameFile.fulfilled, (state, action) => {
            const {fileID, newText} = action.payload
            state.folders = state.folders.map((folder) => {
                if(folder.children){
                    return {
                        ...folder,
                        children : folder.children.map((file) => (
                            file.id === fileID ? {...file , name : newText} : file
                        ))
                    }
                }
                return folder
            })
            //also update the selected document if it is selected
            if(state.selectedDocument?.id === fileID){
                state.selectedDocument = {...state.selectedDocument, name: newText};
            }
        })
        .addCase(deleteFile.fulfilled, (state, action) => {
            const fileID = action.payload
            state.folders = state.folders.map((folder) => {
                if(folder.children) {
                    return {
                        ...folder,
                        children : folder.children.filter((file) => (
                            file.id !== fileID
                        ))
                    }
                }
                return folder
            })

            //also update the selected document if it is selected
            if(state.selectedDocument?.id === fileID){
                state.selectedDocument = null;
            }
        })

    }

})


export const { toggleExpandedFolders,toggleSideBar, selectDocument} = folderSlice.actions

export default folderSlice.reducer