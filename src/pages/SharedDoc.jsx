import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input';
import { Button } from '../components/ui/button'

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { db } from '@/Firebase/firebase-config'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { throttle } from 'lodash'
import { useNavigate, useParams } from 'react-router-dom'
import { Github } from 'lucide-react';

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

function SharedDoc() {
  const {id} = useParams();
  const navigate = useNavigate();
  const [filename, setFilename] = useState("");
  const [docError, setDocError] = useState(false)

  const quillRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false)
  const isLocalChange = useRef(false)
  const docRef = id ? doc(db,"documents", id): null ;

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
    if (!docRef || !quillRef.current) return;
    
    const editor = quillRef.current.getEditor()

    //-------------- Load initial content
    getDoc(docRef)
    .then((snapshot) => {
      if(snapshot.exists() && snapshot.data()){
        editor.setContents(snapshot.data().content)
        setFilename(snapshot.data().name)
      }
      else{
        console.log("No document or content found... start with empty document")
        setDocError(true)
      }
    })
    .catch((err) => {
      console.error("Error fetching document content", err);
    })

    //-------------- Real-time changes listener
    const unSubscribe = onSnapshot(docRef, (snapshot) => {
      if(snapshot.exists()){
        const newContent = snapshot.data().content;
        setFilename(snapshot.data().name);

        // Avoid overwriting user input during editing
        if(!isEditing && !isLocalChange.current){
          const currentCursorPosition = editor.getSelection()?.index || 0;

          editor.setContents(newContent, "silent");
          editor.setSelection(currentCursorPosition);
        }
      }
    })
    
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

    // cleanup
    return () => {
      unSubscribe()
      editor.off("text-change", handleTextChange);

      // Clear timeout on unmount
      if (isEditingTimeout.current) {
        clearTimeout(isEditingTimeout.current);
      }
    };
  },[])


  return (
    <div className="flex flex-col h-screen">

        <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
                <Input
                    type="text"
                    value={filename}
                    className= {`text-lg font-semibold bg-transparent max-w-[200px] sm:max-w-none `}
                    readOnly
                />
            </div>
            <div className="flex items-center gap-1 ml-2 md:gap-4">
                <Button
                  variant="secondary"
                  size="icon"
                  className="inline-flex"
                  onClick={() => window.open('https://github.com/PiyushGhavghave/DocSync', '_blank')}
                  aria-label="GitHub"
                >
                  <Github className="h-5 w-5" />
                </Button>
                <Button size="sm" onClick ={() => navigate('/')}>
                  Create own Document
                </Button>
            </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-auto">
            {!docError 
            ? <ReactQuill ref={quillRef} className='h-screen' modules={modules} theme="snow" /> 
            : <div className='flex justify-center items-center h-screen'><h2>No valid document</h2></div>
            }
          </main>
        </div>
    </div>
  )
}

export default SharedDoc;




