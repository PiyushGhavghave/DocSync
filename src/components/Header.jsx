import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { LogOut,Github} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"
import { useDispatch, useSelector } from 'react-redux'
import { renameFile } from '@/features/folderSlice/folderslice'
import { signOut } from 'firebase/auth'
import { auth } from '@/Firebase/firebase-config'


export default function Header() {
  const selectedDocument = useSelector((state) => state.folder.selectedDocument);
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch();

  const [link, setLink] = useState(`${window.location.origin}/document/${selectedDocument? selectedDocument.id : 'DOCUMENT_NOT_FOUND'}`)
  const [inputvalue, setInputvalue] = useState(selectedDocument? selectedDocument.name : "Select Document")
  const name = user.name?.split(" ")[0] || 'User'
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

  const handleSubmit = (e) => {
    e.preventDefault();
    if(selectedDocument && inputvalue !== ''){
      dispatch(renameFile({userUID : user.uid, fileID : selectedDocument?.id, newText : inputvalue}))
    }
  }
  const handleLogout = () => {
    signOut(auth)
    .then(() => console.log("Signed Out successfully!"))
    .catch((err) => console.error("Error while Sign out",err))
  }

  useEffect(() => {
    if(selectedDocument){
      setInputvalue(selectedDocument.name)
      setLink(`${window.location.origin}/document/${selectedDocument.id}`)
    }
  },[selectedDocument])

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <form className="flex items-center gap-4" onSubmit={handleSubmit}>
        <Input
          type="text"
          value={inputvalue}
          onChange={(e) => setInputvalue(e.target.value)}
          className= {`text-lg font-semibold bg-transparent max-w-[200px] sm:max-w-none ${inputvalue === ''? 'border border-red-600' : ''}`}
          readOnly = {!selectedDocument}
        />
      </form>
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="icon"
          className="inline-flex"
          onClick={() => window.open('https://github.com/PiyushGhavghave', '_blank')}
          aria-label="GitHub"
        >
          <Github className="h-5 w-5" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="inline-flex">Share</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Share Link</h4>
              <p className="text-sm text-muted-foreground">Anyone with this link can view and edit the document</p>
              <div className="flex space-x-2">
                <Input 
                  value={link}
                  readOnly
                />
                <Button size="sm" onClick={() => navigator.clipboard.writeText(link)}>
                  Copy
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Avatar className="cursor-pointer">
              <AvatarImage src={user.photoURL} alt="User avatar" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="space-y-4">
              <p className="text-sm font-medium">Welcome, {capitalizedName}!</p>
              <Button className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}

