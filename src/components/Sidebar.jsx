import { useState } from 'react'
import { FileText, Folder, ChevronRight, ChevronDown, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { useSelector ,useDispatch} from 'react-redux'
import { toggleExpandedFolders,selectDocument,toggleSideBar, createFolder, createFile, renameFolder, renameFile, deleteFolder, deleteFile} from '../features/folderSlice/folderslice'


export default function Sidebar() {
  
  const items = useSelector((state) => state.folder.folders)
  const expandedFolders = useSelector((state) => state.folder.expandedFolders)
  const selectedDocument = useSelector((state) => state.folder.selectedDocument)
  const userid = useSelector((state) => state.auth.user.uid)
  const dispatch = useDispatch()
  
  
  const [editingItem, setEditingItem] = useState(null)


  const saveEdit = (newName) => {
    if (editingItem) {
      editingItem.type === 'folder'
      ? dispatch(renameFolder({userUID: userid, folderID :editingItem.id, newText : newName})) 
      : dispatch(renameFile({userUID : userid,fileID : editingItem.id, newText : newName}))

      setEditingItem(null)
    }
  }

  const deleteItem = (item) => {
    item.type === 'folder' 
    ? dispatch(deleteFolder({userUID : userid,folderID : item.id})) 
    : dispatch(deleteFile({userUID: userid, fileID : item.id}))
  }

  const renderItems = (items, level = 0) => {
    return items.map(item => (
      <li key={item.id} className={`ml-${level * 4}`}>
        <div className="flex items-center gap-2 py-1">
          {item.type === 'folder' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={() => dispatch(toggleExpandedFolders(item.id))}
            >
              {expandedFolders.includes(item.id)? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          {item.type === 'folder' ? (
            <Folder className="h-4 w-4" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          <span 
            onClick={() => {
              if (item.type === 'file') {
                dispatch(selectDocument(item))
              }
            }}
            className={`cursor-pointer ${selectedDocument?.id === item.id ? 'font-bold' : ''}`}
          >
            {item.name}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-4 w-4 ml-auto">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setEditingItem(item)}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => deleteItem(item)}>
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
              {item.type === 'folder' && (
                <DropdownMenuItem onSelect={() => dispatch(createFile({userUID : userid, folderID: item.id}))}>
                  <Plus className="mr-2 h-4 w-4" />
                  <span>New File</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {item.type === 'folder' && expandedFolders.includes(item.id) && item.children && (
          <ul>{renderItems(item.children, level + 1)}</ul>
        )}
      </li>
    ))
  }

  return (
    <div className="w-64 h-full bg-gray-100 p-4 overflow-auto">
      <div className='flex items-center justify-between mb-4'>
        <h2 className="text-lg font-semibold">Document Structure</h2>
        <div className="p-2 flex items-center md:hidden">
            <Button variant="outline" size="icon" onClick={() => dispatch(toggleSideBar())} aria-label="Toggle sidebar">
              <X className="h-4 w-4" />
            </Button>
        </div>
      </div>

      {/* only above changes are made */}
      <ul className="space-y-2">{renderItems(items)}</ul>
      <div className="mt-4 space-y-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => dispatch(createFolder(userid))}
        >
          New Folder
        </Button>
        
      </div>
      <Dialog open={editingItem !== null} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editingItem?.type}</DialogTitle>
          </DialogHeader>
          <Input
            defaultValue={editingItem?.name}
            onChange={(e) => {
              if (editingItem) {
                setEditingItem({ ...editingItem, name: e.target.value })
              }
            }}
          />
          <Button onClick={() => saveEdit(editingItem?.name || '')}>Save</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}


