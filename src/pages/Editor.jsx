import { useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import { Button } from '../components/ui/button'
import { Menu } from 'lucide-react'

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useDispatch, useSelector } from 'react-redux'
import {toggleSideBar} from '../features/folderSlice/folderslice'
import { db } from '@/Firebase/firebase-config'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { throttle } from 'lodash'

const modules = {
  toolbar: [
    [{'header': []}],
    [{ 'font': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['bold', 'italic', 'underline'],
    ['link'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    ['blockquote', 'code-block'],
  ],
};

function Editor() {

  const selectedDocument = useSelector((state) => state.folder.selectedDocument)
  const isSidebarOpen = useSelector((state) => state.folder.isSidebarOpen)
  const dispatch = useDispatch()
  
  const quillRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false)
  const isLocalChange = useRef(false)
  const docRef = selectedDocument? doc(db,"documents",selectedDocument.id): null ;

  const saveContent = throttle( async () => {
    if(quillRef.current && docRef && isLocalChange.current){
      const content = quillRef.current.getEditor().getContents();
      try{
        await setDoc(docRef, {content : content.ops}, {merge : true})
      }
      catch(err){
        console.error("Failed to save content to firestore")
      }
      isLocalChange.current = false;
    }

  }, 500)

const isEditingTimeout = useRef(null);

useEffect(() => {
  if (!selectedDocument || !docRef || !quillRef.current) return;

  const editor = quillRef.current.getEditor();

  // ------------- Load initial content
  getDoc(docRef)
    .then((snapshot) => {
      if (snapshot.exists() && snapshot.data().content) {
        editor.setContents(snapshot.data().content);
      } 
      else {
        console.log("No document or content found... starting with an empty document");
      }
    })
    .catch((err) => {
      console.error("Error fetching document content:", err);
    });

  // -------------- Real-time changes listener
  const unSubscribe = onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const newContent = snapshot.data().content;

      // Avoid overwriting user input during editing
      if (!isEditing && !isLocalChange.current) {
        const currentCursorPosition = editor.getSelection()?.index || 0;

        editor.setContents(newContent, "silent");
        editor.setSelection(currentCursorPosition);
      }
    }
  });

  //-------------- Listen to local changes and save it to firestore
  const handleTextChange = (delta, oldDelta, source) => {
    if (source === "user") {
      isLocalChange.current = true;

      setIsEditing(true);

      saveContent();

      // Clear any existing timeout before setting
      if (isEditingTimeout.current) {
        clearTimeout(isEditingTimeout.current);
      }

      // Reset editing state after 5 seconds of inactivity
      isEditingTimeout.current = setTimeout(() => {
        setIsEditing(false);
      }, 5000);
    }
  };

  editor.on("text-change", handleTextChange);

  // Cleanup
  return () => {
    unSubscribe();
    editor.off("text-change", handleTextChange);

    // Clear timeout on unmount
    if (isEditingTimeout.current) {
      clearTimeout(isEditingTimeout.current);
    }
  };
}, [selectedDocument]);


  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className={`${isSidebarOpen ? 'hidden' : 'block'} bg-gray-100 p-2 pt-4 flex md:hidden`}>
            <Button variant="outline" size="icon" onClick={() => dispatch(toggleSideBar())} aria-label="Toggle sidebar">
              <Menu className="h-4 w-4" />
            </Button>
        </div>
        <div className={`${isSidebarOpen ? 'block' : 'hidden'} md:block`}>
          <Sidebar />
        </div>

        <main className="flex-1 overflow-auto">
          {selectedDocument 
          ? <ReactQuill ref={quillRef} className='h-screen' modules={modules} theme="snow" /> 
          : <div className='flex justify-center items-center h-screen'><h2>Select document or Create folder/file</h2></div>
          }
        </main>
      </div>
    </div>
  )
}

export default Editor;




