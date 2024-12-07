import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input';
import { Button } from '../components/ui/button'

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { db } from '@/Firebase/firebase-config'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { debounce } from 'lodash'
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

  const saveContent = debounce( async () => {
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

  }, 200)

  useEffect(() => {
    if (!docRef || !quillRef.current) return;
    
    const editor = quillRef.current.getEditor()

    //-------------- Load initial data from firestore
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

    //-------------- Listen to realtime changes and update locally
    const unSubscribe = onSnapshot(docRef, (snapshot) => {
      if(snapshot.exists()){
        const newContent = snapshot.data().content;
        setFilename(snapshot.data().name);

        if(!isEditing){
          const currentCursorPosition = editor.getSelection()?.index || 0;

          editor.setContents(newContent, "silent");
          editor.setSelection(currentCursorPosition);
        }
      }
    })
    
    //-------------- Listen to local changes and save it to firestore
    editor.on("text-change", (delta, oldDelta, source) => {
      if(source === "user"){
        isLocalChange.current = true;

        setIsEditing(true)

        const isContentChanged = delta.ops.some((op) => op.insert || op.delete);
        if(isContentChanged){
          saveContent()
        }

        //Reset editing state after 5 sec of inactivity
        setTimeout(() => {
          setIsEditing(false)
        }, 5000);
      }
    })

    return () => {
      unSubscribe()
      editor.off("text-change")
    }

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




